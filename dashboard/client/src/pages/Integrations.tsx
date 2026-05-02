import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

const INTEGRATIONS = [
  {
    id: "meta",
    name: "Meta API (Instagram & Facebook)",
    description: "Configure acesso à Meta para publicar em Instagram e Facebook",
    color: "bg-blue-600",
    fields: [
      { key: "metaAppId", label: "App ID", isSecret: true },
      { key: "metaAppSecret", label: "App Secret", isSecret: true },
      { key: "metaPageAccessToken", label: "Page Access Token", isSecret: true },
      { key: "metaPageId", label: "Page ID", isSecret: false },
      { key: "metaInstagramAccountId", label: "Instagram Account ID", isSecret: false },
    ],
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Configure bot do Telegram para publicar ofertas",
    color: "bg-blue-400",
    fields: [
      { key: "telegramBotToken", label: "Bot Token", isSecret: true },
      { key: "telegramChatId", label: "Chat ID", isSecret: false },
    ],
  },
  {
    id: "shopee",
    name: "Shopee",
    description: "Configure acesso à API da Shopee para buscar produtos",
    color: "bg-orange-600",
    fields: [
      { key: "shopeeApiKey", label: "API Key", isSecret: true },
      { key: "shopeePartnerId", label: "Partner ID", isSecret: false },
    ],
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    description: "Configure GTM para rastreamento de eventos (opcional - não ativo ainda)",
    color: "bg-gray-600",
    fields: [{ key: "gtmId", label: "GTM ID", isSecret: false }],
  },
];

export default function Integrations() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});

  const updateSettingsMutation = trpc.admin.updateIntegrationSettings.useMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!selectedIntegration) return;

    try {
      await updateSettingsMutation.mutateAsync({
        integrationName: selectedIntegration,
        settings: formData,
      });
      toast.success(`${selectedIntegration.toUpperCase()} configurado com sucesso!`);
      setFormData({});
      setSelectedIntegration(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const currentIntegration = selectedIntegration
    ? INTEGRATIONS.find((i) => i.id === selectedIntegration)
    : null;

  const IntegrationField = ({ field }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{field.label}</label>
      <div className="flex gap-2">
        <Input
          type={field.isSecret && !showSecrets[field.key] ? "password" : "text"}
          placeholder={`Digite ${field.label.toLowerCase()}`}
          value={formData[field.key] || ""}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className="bg-slate-900 border-slate-700 text-white flex-1"
        />
        {field.isSecret && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleShowSecret(field.key)}
            title={showSecrets[field.key] ? "Ocultar" : "Mostrar"}
          >
            {showSecrets[field.key] ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrações</h1>
          <p className="text-muted-foreground mt-1">Configure APIs e serviços externos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Integrations List */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">Serviços Disponíveis</h2>
            {INTEGRATIONS.map((integration) => (
              <button
                key={integration.id}
                onClick={() => {
                  setSelectedIntegration(integration.id);
                  setFormData({});
                  setShowSecrets({});
                }}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedIntegration === integration.id
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-border hover:border-orange-500/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {integration.fields.length} campos
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition ${
                      selectedIntegration === integration.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            {selectedIntegration && currentIntegration ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentIntegration.name}</CardTitle>
                      <CardDescription>{currentIntegration.description}</CardDescription>
                    </div>
                    <Badge className={currentIntegration.color}>Configurar</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentIntegration.fields.map((field) => (
                    <IntegrationField key={field.key} field={field} />
                  ))}

                  {selectedIntegration === "gtm" && (
                    <div className="p-3 bg-yellow-500/10 rounded text-sm text-yellow-600 border border-yellow-500/20">
                      ℹ️ O GTM será configurado mas não ativado por enquanto. Você poderá ativar quando estiver pronto.
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={updateSettingsMutation.isPending}
                      className={`flex-1 ${currentIntegration.color}`}
                    >
                      {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedIntegration(null);
                        setFormData({});
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Selecione um serviço à esquerda para configurar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Removed Integrations */}
        <Card className="bg-card border-border border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-500">Integrações Removidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Buffer foi removido. Use Meta API diretamente para Instagram e Facebook.</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="bg-card border-border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-600">🔒 Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Dados sensíveis (tokens, secrets) são criptografados no servidor</p>
              <p>✓ Nunca são retornados para o frontend após salvar</p>
              <p>✓ Use o ícone de olho para visualizar/ocultar durante configuração</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
