import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminUsers() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPendingQuery = trpc.admin.getPendingUsers.useQuery();
  const authorizeMutation = trpc.admin.authorizeUser.useMutation();
  const rejectMutation = trpc.admin.rejectUser.useMutation();

  useEffect(() => {
    if (getPendingQuery.data) {
      setPendingUsers(getPendingQuery.data);
      setIsLoading(false);
    }
  }, [getPendingQuery.data]);

  const handleAuthorize = async (userId: number) => {
    try {
      await authorizeMutation.mutateAsync({ userId });
      toast.success("Usuário autorizado!");
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      getPendingQuery.refetch();
    } catch (error) {
      toast.error("Erro ao autorizar usuário");
    }
  };

  const handleReject = async (userId: number) => {
    try {
      await rejectMutation.mutateAsync({ userId });
      toast.success("Usuário rejeitado");
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      getPendingQuery.refetch();
    } catch (error) {
      toast.error("Erro ao rejeitar usuário");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-gray-400 mt-2">Autorize ou rejeite solicitações de acesso</p>
        </div>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-orange-500" />
              Solicitações Pendentes ({pendingUsers.length})
            </CardTitle>
            <CardDescription>
              Usuários aguardando aprovação para acessar o dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma solicitação pendente
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500/50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Solicitado em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAuthorize(user.id)}
                        disabled={authorizeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Autorizar
                      </Button>
                      <Button
                        onClick={() => handleReject(user.id)}
                        disabled={rejectMutation.isPending}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
