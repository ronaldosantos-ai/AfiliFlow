import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, Mail, Calendar, Loader2 } from "lucide-react";

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  const pendingUsersQuery = trpc.admin.getPendingUsers.useQuery();
  const allUsersQuery = trpc.admin.getAllUsers.useQuery();
  const authorizeMutation = trpc.admin.authorizeUser.useMutation();
  const rejectMutation = trpc.admin.rejectUser.useMutation();

  const handleAuthorize = async (userId: number) => {
    try {
      await authorizeMutation.mutateAsync({ userId });
      toast.success("Usuário autorizado com sucesso!");
      pendingUsersQuery.refetch();
      allUsersQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao autorizar");
    }
  };

  const handleReject = async (userId: number) => {
    try {
      await rejectMutation.mutateAsync({ userId });
      toast.success("Usuário rejeitado com sucesso!");
      pendingUsersQuery.refetch();
      allUsersQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao rejeitar");
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Aprove novos usuários e gerencie acessos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {pendingUsersQuery.data?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {allUsersQuery.data?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Autorizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {allUsersQuery.data?.filter((u: any) => u.isAuthorized).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "pending"
                ? "text-foreground border-b-2 border-orange-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pendentes ({pendingUsersQuery.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "all"
                ? "text-foreground border-b-2 border-orange-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({allUsersQuery.data?.length || 0})
          </button>
        </div>

        {/* Pending Users */}
        {activeTab === "pending" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Usuários Pendentes de Aprovação</CardTitle>
              <CardDescription>Novos usuários aguardando autorização</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsersQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingUsersQuery.data && pendingUsersQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {pendingUsersQuery.data.map((user: any) => (
                    <div
                      key={user.id}
                      className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{user.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAuthorize(user.id)}
                          disabled={authorizeMutation.isPending}
                        >
                          {authorizeMutation.isPending ? "..." : "Aprovar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? "..." : "Rejeitar"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum usuário pendente de aprovação</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Users */}
        {activeTab === "all" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Todos os Usuários</CardTitle>
              <CardDescription>Lista completa de usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {allUsersQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : allUsersQuery.data && allUsersQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-2 font-semibold">Nome</th>
                        <th className="text-left py-2 px-2 font-semibold">Email</th>
                        <th className="text-left py-2 px-2 font-semibold">Role</th>
                        <th className="text-left py-2 px-2 font-semibold">Status</th>
                        <th className="text-left py-2 px-2 font-semibold">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsersQuery.data.map((user: any) => (
                        <tr key={user.id} className="border-b border-border hover:bg-accent/30">
                          <td className="py-3 px-2">{user.name || "N/A"}</td>
                          <td className="py-3 px-2">{user.email}</td>
                          <td className="py-3 px-2">
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge
                              variant={user.isAuthorized ? "default" : "destructive"}
                              className={
                                user.isAuthorized
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }
                            >
                              {user.isAuthorized ? "Autorizado" : "Pendente"}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
