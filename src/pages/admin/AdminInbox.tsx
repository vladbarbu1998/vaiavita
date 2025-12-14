import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2, Eye, Clock, User, MessageSquare, Phone, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

  const unreadCount = submissions?.filter(s => !s.is_read).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold">Inbox Formulare</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount} {unreadCount === 1 ? "nou" : "noi"}
            </Badge>
          )}
        </div>
      </div>

      {submissions?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nu există mesaje încă</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions?.map((submission) => (
            <Card 
              key={submission.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !submission.is_read ? "border-primary/50 bg-primary/5" : ""
              }`}
              onClick={() => openMessage(submission)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-1 ${!submission.is_read ? "text-primary" : "text-muted-foreground"}`}>
                      {submission.is_read ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${!submission.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {submission.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {submission.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {submission.language.toUpperCase()}
                        </Badge>
                      </div>
                      {submission.subject && (
                        <p className="text-sm font-medium text-foreground mt-1">
                          {submission.subject}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(submission.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(submission.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
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
                </div>

                {/* Message Content */}
                <div>
                  <h3 className="font-medium mb-2">Mesaj</h3>
                  <div className="bg-background border rounded-lg p-4 whitespace-pre-wrap">
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
