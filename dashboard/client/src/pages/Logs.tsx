import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

const mockLogs = [
  {
    id: "exec-001",
    timestamp: "2026-04-21T14:30:00Z",
    status: "success",
    productFound: "Fone de Ouvido Bluetooth",
    channelsPublished: ["telegram", "instagram"],
    executionTime: 2340,
  },
  {
    id: "exec-002",
    timestamp: "2026-04-21T13:00:00Z",
    status: "success",
    productFound: "Luminária LED Inteligente",
    channelsPublished: ["telegram", "instagram", "facebook"],
    executionTime: 3120,
  },
  {
    id: "exec-003",
    timestamp: "2026-04-21T11:30:00Z",
    status: "error",
    productFound: null,
    channelsPublished: [],
    errorMessage: "Falha ao conectar com API Shopee",
    executionTime: 5000,
  },
  {
    id: "exec-004",
    timestamp: "2026-04-21T10:00:00Z",
    status: "partial",
    productFound: "Tapete de Yoga",
    channelsPublished: ["telegram"],
    errorMessage: "Falha ao publicar no Instagram",
    executionTime: 4200,
  },
  {
    id: "exec-005",
    timestamp: "2026-04-21T09:00:00Z",
    status: "success",
    productFound: "Sérum Facial Vitamina C",
    channelsPublished: ["telegram", "instagram"],
    executionTime: 2890,
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-accent" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    case "partial":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "success":
      return "Sucesso";
    case "error":
      return "Erro";
    case "partial":
      return "Parcial";
    default:
      return status;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "success":
      return "bg-accent/10 text-accent border-accent/20";
    case "error":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "partial":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR");
};

const formatExecutionTime = (ms: number) => {
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function Logs() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logs de Execução</h1>
            <p className="text-muted-foreground mt-1">Histórico em tempo real do pipeline</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-accent hover:bg-accent/90" : "border-border"}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {autoRefresh ? "Auto-atualização" : "Atualizar"}
            </Button>
            <Button variant="outline" className="border-border">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Histórico de Execuções</CardTitle>
            <CardDescription>Últimas execuções do pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium">Produto</th>
                    <th className="text-left py-3 px-4 font-medium">Canais</th>
                    <th className="text-left py-3 px-4 font-medium">Tempo</th>
                    <th className="text-left py-3 px-4 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="text-foreground">{getStatusLabel(log.status)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {log.productFound || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {log.channelsPublished.length > 0 ? (
                            log.channelsPublished.map((channel) => (
                              <Badge key={channel} variant="secondary" className="text-xs">
                                {channel === "telegram" && "📱"}
                                {channel === "instagram" && "📷"}
                                {channel === "facebook" && "👍"}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatExecutionTime(log.executionTime)}
                      </td>
                      <td className="py-3 px-4">
                        {log.errorMessage && (
                          <div className="text-xs text-destructive cursor-help" title={log.errorMessage}>
                            ⚠️ Erro
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Log Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Últimas Mensagens</CardTitle>
            <CardDescription>Console de saída do pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground space-y-1 max-h-64 overflow-y-auto">
              <div className="text-accent">[14:30:00] ✅ Pipeline iniciado</div>
              <div className="text-foreground">[14:30:05] 🔍 Buscando em Eletrônicos...</div>
              <div className="text-foreground">[14:30:15] ✅ Produto encontrado: Fone de Ouvido Bluetooth</div>
              <div className="text-foreground">[14:30:20] 🎨 Gerando imagem com IA...</div>
              <div className="text-foreground">[14:30:35] ✅ Imagem gerada com sucesso</div>
              <div className="text-foreground">[14:30:40] 📱 Publicando no Telegram...</div>
              <div className="text-accent">[14:30:42] ✅ Publicado no Telegram</div>
              <div className="text-foreground">[14:30:45] 📷 Publicando no Instagram...</div>
              <div className="text-accent">[14:30:50] ✅ Publicado no Instagram</div>
              <div className="text-accent">[14:30:52] ✅ Pipeline finalizado com sucesso</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
