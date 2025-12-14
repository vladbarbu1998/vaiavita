import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2, Clock, User, MessageSquare, Phone, Tag, CheckCircle2, Circle, Search, Filter, Download } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header - matching AdminOrders style */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Inbox</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount} {unreadCount === 1 ? "necitit" : "necitite"}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!submissions?.length}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters - matching AdminOrders style */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută după nume, email, mesaj..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate mesajele</SelectItem>
              <SelectItem value="unread">Necitite</SelectItem>
              <SelectItem value="unreplied">Fără răspuns</SelectItem>
              <SelectItem value="replied">Cu răspuns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSubmissions?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-muted/30 rounded-2xl border border-border/50">
          <Mail className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== "all" ? "Nu s-au găsit mesaje" : "Nu există mesaje încă"}
          </p>
        </div>
      )}

      {/* Messages List */}
      {!isLoading && filteredSubmissions && filteredSubmissions.length > 0 && (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={`group relative bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${
                !submission.is_read ? "border-primary/50 bg-primary/5" : "border-border"
              }`}
              onClick={() => openMessage(submission)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`mt-1 flex-shrink-0 ${!submission.is_read ? "text-primary" : "text-muted-foreground"}`}>
                  {submission.is_read ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-medium ${!submission.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {submission.name}
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {submission.email}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {submission.language.toUpperCase()}
                    </Badge>
                    {submission.replied_at && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Răspuns
                      </Badge>
                    )}
                  </div>
                  {submission.subject && (
                    <p className="text-sm font-medium text-foreground mb-1 truncate">
                      {submission.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {submission.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(submission.created_at), "dd MMM, HH:mm", { locale: ro })}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Replied checkbox */}
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors"
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
                      <span className="text-xs text-muted-foreground">Răspuns</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(submission.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    <Button asChild variant="outline">
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
              Această acțiune nu poate fi anulată. Mesajul va fi șters permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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