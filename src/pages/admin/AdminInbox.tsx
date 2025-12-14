import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2, Clock, User, MessageSquare, Phone, Tag, CheckCircle2, Circle, Search, Download, Eye, Globe, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  language: string;
  is_read: boolean;
  created_at: string;
  replied_at: string | null;
  admin_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

const AdminInbox = () => {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["contact-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactSubmission[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    },
  });

  const toggleRepliedMutation = useMutation({
    mutationFn: async ({ id, replied }: { id: string; replied: boolean }) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ replied_at: replied ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast.success("Status actualizat");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast.success("Notițe salvate");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast.success("Mesaj șters");
      setDeleteId(null);
    },
  });

  const openMessage = (submission: ContactSubmission) => {
    setSelectedMessage(submission);
    setAdminNotes(submission.admin_notes || "");
    if (!submission.is_read) {
      markAsReadMutation.mutate(submission.id);
    }
  };

  const exportCSV = () => {
    if (!submissions || submissions.length === 0) return;

    const headers = ["Nume", "Email", "Telefon", "Subiect", "Mesaj", "Limba", "Data", "Citit", "Răspuns"];
    const csvContent = [
      headers.join(","),
      ...submissions.map(s => [
        `"${s.name}"`,
        `"${s.email}"`,
        `"${s.phone || ""}"`,
        `"${s.subject || ""}"`,
        `"${s.message.replace(/"/g, '""')}"`,
        s.language,
        format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
        s.is_read ? "Da" : "Nu",
        s.replied_at ? "Da" : "Nu"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inbox-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Filter and search
  const filteredSubmissions = submissions?.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "unread") return matchesSearch && !s.is_read;
    if (filterStatus === "unreplied") return matchesSearch && !s.replied_at;
    if (filterStatus === "replied") return matchesSearch && !!s.replied_at;
    return matchesSearch;
  });

  const unreadCount = submissions?.filter(s => !s.is_read).length || 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl tracking-wide">Inbox</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount} {unreadCount === 1 ? "necitit" : "necitite"}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Gestionează mesajele de contact</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!submissions?.length}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Caută după nume, email, mesaj..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate mesajele</SelectItem>
            <SelectItem value="unread">Necitite</SelectItem>
            <SelectItem value="unreplied">Fără răspuns</SelectItem>
            <SelectItem value="replied">Cu răspuns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expeditor</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subiect / Mesaj</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{searchQuery || filterStatus !== "all" ? "Nu s-au găsit mesaje" : "Nu există mesaje încă"}</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions?.map((submission) => (
                  <tr 
                    key={submission.id} 
                    className={`hover:bg-muted/30 transition-colors ${!submission.is_read ? "bg-primary/5" : ""}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 ${!submission.is_read ? "text-primary" : "text-muted-foreground"}`}>
                          {submission.is_read ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium truncate ${!submission.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {submission.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {submission.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-[300px]">
                        {submission.subject && (
                          <p className="font-medium truncate mb-0.5">{submission.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">{submission.message}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(submission.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {submission.language.toUpperCase()}
                        </Badge>
                        {submission.replied_at ? (
                          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Răspuns
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Neaserăspuns
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <div 
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRepliedMutation.mutate({ 
                              id: submission.id, 
                              replied: !submission.replied_at 
                            });
                          }}
                        >
                          <Checkbox
                            checked={!!submission.replied_at}
                            className="pointer-events-none"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openMessage(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(submission.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {selectedMessage.subject || "Mesaj contact"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Sender Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedMessage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedMessage.email}`} className="text-sm text-primary hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedMessage.phone}`} className="text-sm text-primary hover:underline">
                        {selectedMessage.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(selectedMessage.created_at), "dd MMMM yyyy, HH:mm", { locale: ro })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline">{selectedMessage.language.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMessage.replied_at ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                      {selectedMessage.replied_at 
                        ? `Răspuns: ${format(new Date(selectedMessage.replied_at), "dd MMM, HH:mm", { locale: ro })}`
                        : "Fără răspuns"
                      }
                    </span>
                  </div>
                </div>

                {/* IP & Device Info */}
                {(selectedMessage.ip_address || selectedMessage.user_agent) && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      Informații dispozitiv
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {selectedMessage.ip_address && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[80px]">IP:</span>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{selectedMessage.ip_address}</span>
                        </div>
                      )}
                      {selectedMessage.user_agent && (
                        <div className="flex items-start gap-2">
                          <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground break-all">{selectedMessage.user_agent}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Replied Toggle */}
                <div 
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    toggleRepliedMutation.mutate({ 
                      id: selectedMessage.id, 
                      replied: !selectedMessage.replied_at 
                    });
                    setSelectedMessage({
                      ...selectedMessage,
                      replied_at: selectedMessage.replied_at ? null : new Date().toISOString()
                    });
                  }}
                >
                  <Checkbox checked={!!selectedMessage.replied_at} />
                  <span className="text-sm font-medium">Marchează ca răspuns trimis</span>
                </div>

                {/* Message Content */}
                <div>
                  <h3 className="font-medium mb-2">Mesaj</h3>
                  <div className="bg-background border rounded-xl p-4 whitespace-pre-wrap text-sm">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="font-medium mb-2">Notițe admin</h3>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Adaugă notițe despre acest mesaj..."
                    className="min-h-[100px]"
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => updateNotesMutation.mutate({ id: selectedMessage.id, notes: adminNotes })}
                    disabled={updateNotesMutation.isPending}
                  >
                    Salvează notițe
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button asChild variant="outline" className="flex-1">
                    <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || "Mesaj contact VAIAVITA"}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Răspunde pe email
                    </a>
                  </Button>
                  {selectedMessage.phone && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={`tel:${selectedMessage.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Sună
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge mesajul?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Mesajul va fi șters definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminInbox;
