import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function Config() {
  const [config, setConfig] = useState({
    scheduleTimes: ["09:00", "15:00", "21:00"],
    maxPrice: 1000,
    minRating: 3.5,
    keywords: {
      HomeAndKitchen: "casa cozinha utilidades",
      BeautyAndPersonalCare: "maquiagem cuidados pele",
      SportsAndOutdoors: "esportes fitness academia",
      Electronics: "eletronicos celular acessorios",
    },
  });

  const [newTime, setNewTime] = useState("");

  const handleAddTime = () => {
    if (newTime && !config.scheduleTimes.includes(newTime)) {
      setConfig({
        ...config,
        scheduleTimes: [...config.scheduleTimes, newTime].sort(),
      });
      setNewTime("");
      toast.success("Horário adicionado com sucesso");
    }
  };

  const handleRemoveTime = (time: string) => {
    setConfig({
      ...config,
      scheduleTimes: config.scheduleTimes.filter((t) => t !== time),
    });
    toast.success("Horário removido com sucesso");
  };

  const handleKeywordChange = (category: string, value: string) => {
    setConfig({
      ...config,
      keywords: {
        ...config.keywords,
        [category]: value,
      },
    });
  };

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações do Pipeline</h1>
          <p className="text-muted-foreground mt-1">Ajuste os parâmetros de execução e busca</p>
        </div>

        {/* Schedule Times */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Horários de Agendamento (SCHEDULE_TIMES)</CardTitle>
            <CardDescription>
              Defina os horários em que o pipeline será executado automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="HH:MM"
                className="flex-1"
              />
              <Button onClick={handleAddTime} className="bg-accent hover:bg-accent/90">
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.scheduleTimes.map((time) => (
                <div
                  key={time}
                  className="flex items-center gap-2 bg-accent/10 px-3 py-2 rounded-lg border border-accent/20"
                >
                  <span className="font-medium text-foreground">{time}</span>
                  <button
                    onClick={() => handleRemoveTime(time)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price and Rating Filters */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Filtros de Produto</CardTitle>
            <CardDescription>
              Configure os limites de preço e avaliação mínima
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPrice" className="text-foreground">
                  Preço Máximo (MAX_PRICE)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxPrice"
                    type="number"
                    value={config.maxPrice}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxPrice: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">R$</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRating" className="text-foreground">
                  Avaliação Mínima (MIN_RATING)
                </Label>
                <Input
                  id="minRating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={config.minRating}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      minRating: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords by Category */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Palavras-chave por Categoria</CardTitle>
            <CardDescription>
              Customize as palavras-chave de busca para cada categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(config.keywords).map(([category, keywords]) => (
              <div key={category} className="space-y-2">
                <Label htmlFor={category} className="text-foreground font-medium">
                  {category === "HomeAndKitchen" && "Casa e Cozinha"}
                  {category === "BeautyAndPersonalCare" && "Beleza e Cuidados Pessoais"}
                  {category === "SportsAndOutdoors" && "Esportes e Outdoor"}
                  {category === "Electronics" && "Eletrônicos"}
                </Label>
                <Input
                  id={category}
                  value={keywords}
                  onChange={(e) => handleKeywordChange(category, e.target.value)}
                  placeholder="Digite as palavras-chave separadas por espaço"
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
