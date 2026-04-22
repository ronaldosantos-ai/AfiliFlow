import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  status: "healthy" | "warning" | "error";
  lastCheck: string;
  responseTime: number;
  errorMessage?: string;
  description: string;
}

const mockIntegrations: Integration[] = [
  {
    id: "shopee",
    name: "Shopee API",
    status: "healthy",
    lastCheck: "2026-04-21T14:35:00Z",
    responseTime: 245,
    description: "Busca de produtos afiliados",
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    status: "healthy",
    lastCheck: "2026-04-21T14:30:00Z",
    responseTime: 1200,
    description: "Publicação em canais Telegram",
  },
  {
    id: "buffer_instagram",
    name: "Buffer/Instagram",
    status: "warning",
    lastCheck: "2026-04-21T14:25:00Z",
    responseTime: 3500,
    errorMessage: "Tempo de resposta elevado",
    description: "Publicação em Instagram via Buffer",
  },
  {
    id: "gemini",
    name: "Gemini AI",
    status: "healthy",
    lastCheck: "2026-04-21T14:20:00Z",
    responseTime: 2100,
    description: "Geração de imagens com IA",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return <CheckCircle className="w-6 h-6 text-accent" />;
    case "warning":
      return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    case "error":
      return <XCircle className="w-6 h-6 text-destructive" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "healthy":
      return "Saudável";
    case "warning":
      return "Aviso";
    case "error":
      return "Erro";
    default:
      return status;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "healthy":
      return "bg-accent/10 text-accent border-accent/20";
    case "warning":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "error":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}m atrás`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  return date.toLocaleString("pt-BR");
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState(mockIntegrations);

  const handleTestIntegration = (id: string) => {
    toast.loading(`Testando ${id}...`);
    setTimeout(() => {
      toast.success(`${id} testado com sucesso!`);
    }, 2000);
  };

  const healthyCount = integrations.filter((i) => i.status === "healthy").length;
  const warningCount = integrations.filter((i) => i.status === "warning").length;
  const errorCount = integrations.filter((i) => i.status === "error").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integrações</h1>
            <p className="text-muted-foreground mt-1">
              Status das conexões externas do pipeline
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar Tudo
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                Saudáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{healthyCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Avisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{warningCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Erros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{errorCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations List */}
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {getStatusIcon(integration.status)}
                    </div>

                    {/* Integration Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {integration.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${getStatusBadgeClass(integration.status)} border`}
                        >
                          {getStatusLabel(integration.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {integration.description}
                      </p>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Resposta: {integration.responseTime}ms
                        </div>
                        <div>
                          Última verificação: {formatDate(integration.lastCheck)}
                        </div>
                      </div>

                      {/* Error Message */}
                      {integration.errorMessage && (
                        <div className="mt-2 p-2 bg-yellow-500/10 rounded text-xs text-yellow-600">
                          ⚠️ {integration.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Test Button */}
                  <Button
                    onClick={() => handleTestIntegration(integration.name)}
                    variant="outline"
                    size="sm"
                    className="border-border"
                  >
                    Testar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detalhes de Configuração</CardTitle>
            <CardDescription>
              Informações sobre as integrações ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Shopee API</p>
                <p className="text-muted-foreground">
                  Endpoint: https://api.shopee.com.br/v2/
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Telegram Bot</p>
                <p className="text-muted-foreground">
                  Token configurado e ativo. Canais: 2 ativos
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Buffer/Instagram</p>
                <p className="text-muted-foreground">
                  Contas conectadas: 1. Limite de requisições: 1000/dia
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Gemini AI</p>
                <p className="text-muted-foreground">
                  Modelo: Gemini 2.0. Quota: 100 imagens/dia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
