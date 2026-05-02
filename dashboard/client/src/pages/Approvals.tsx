import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function Approvals() {
  const [selectedApproval, setSelectedApproval] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const approvalsQuery = trpc.admin.getPendingApprovals.useQuery();
  const approveMutation = trpc.admin.approveContent.useMutation();
  const rejectMutation = trpc.admin.rejectContent.useMutation();

  const handleApprove = async (approvalId: number) => {
    try {
      await approveMutation.mutateAsync({ approvalId });
      toast.success("Conteúdo aprovado com sucesso!");
      approvalsQuery.refetch();
      setSelectedApproval(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao aprovar");
    }
  };

  const handleReject = async (approvalId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Por favor, forneça um motivo para rejeição");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ approvalId, reason: rejectionReason });
      toast.success("Conteúdo rejeitado com sucesso!");
      approvalsQuery.refetch();
      setSelectedApproval(null);
      setRejectionReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao rejeitar");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aprovação de Conteúdo</h1>
          <p className="text-muted-foreground mt-1">Revise e aprove conteúdo antes de publicar</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {approvalsQuery.data?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Conteúdo Pendente</CardTitle>
            <CardDescription>Produtos aguardando aprovação para publicação</CardDescription>
          </CardHeader>
          <CardContent>
            {approvalsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : approvalsQuery.data && approvalsQuery.data.length > 0 ? (
              <div className="space-y-4">
                {approvalsQuery.data.map((approval: any) => (
                  <div
                    key={approval.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent/50 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {approval.productImage && (
                          <img
                            src={approval.productImage}
                            alt={approval.productName}
                            className="w-16 h-16 rounded object-cover mb-2"
                          />
                        )}
                        <h3 className="font-semibold text-foreground">{approval.productName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Canais: {approval.proposedChannels?.join(", ") || "N/A"}
                        </p>
                        <a
                          href={approval.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                        >
                          Ver Produto
                        </a>
                      </div>

                      {selectedApproval === approval.id ? (
                        <div className="w-64 space-y-3">
                          <textarea
                            placeholder="Motivo da rejeição (se aplicável)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm placeholder:text-gray-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(approval.id)}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? "..." : "Aprovar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleReject(approval.id)}
                              disabled={rejectMutation.isPending}
                            >
                              {rejectMutation.isPending ? "..." : "Rejeitar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApproval(null);
                                setRejectionReason("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelectedApproval(approval.id)}
                        >
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum conteúdo pendente de aprovação</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
