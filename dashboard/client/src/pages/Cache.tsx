import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const mockCacheItems = [
  {
    id: 1,
    productId: "shopee-123456",
    productName: "Fone de Ouvido Bluetooth Premium",
    publishedAt: "2026-04-21T10:30:00Z",
  },
  {
    id: 2,
    productId: "shopee-234567",
    productName: "Luminária LED Inteligente",
    publishedAt: "2026-04-21T09:15:00Z",
  },
  {
    id: 3,
    productId: "shopee-345678",
    productName: "Tapete de Yoga Antiderrapante",
    publishedAt: "2026-04-21T08:00:00Z",
  },
  {
    id: 4,
    productId: "shopee-456789",
    productName: "Sérum Facial Vitamina C",
    publishedAt: "2026-04-21T07:30:00Z",
  },
  {
    id: 5,
    productId: "shopee-567890",
    productName: "Carregador Rápido USB-C 65W",
    publishedAt: "2026-04-21T06:45:00Z",
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR");
};

export default function Cache() {
  const [cacheItems, setCacheItems] = useState(mockCacheItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const filteredItems = cacheItems.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setCacheItems((prev) =>
      prev.filter((item) => !selectedItems.includes(item.id))
    );
    setSelectedItems([]);
    toast.success(`${selectedItems.length} item(ns) removido(s) do cache`);
  };

  const handleClearAll = () => {
    setCacheItems([]);
    setSelectedItems([]);
    toast.success("Cache limpo completamente");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciador de Cache</h1>
            <p className="text-muted-foreground mt-1">
              Produtos já publicados ({cacheItems.length})
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={handleClearAll}
              variant="destructive"
              disabled={cacheItems.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Tudo
            </Button>
          </div>
        </div>

        {/* Cache Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total em Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{cacheItems.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Selecionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{selectedItems.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Espaço Ocupado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {(cacheItems.length * 0.5).toFixed(1)} KB
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Itens em Cache</CardTitle>
            <CardDescription>Produtos que já foram publicados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou ID do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Delete Selected Button */}
            {selectedItems.length > 0 && (
              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} item(ns) selecionado(s)
                </span>
                <Button
                  onClick={handleDeleteSelected}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Selecionados
                </Button>
              </div>
            )}

            {/* Cache Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedItems.length === filteredItems.length &&
                          filteredItems.length > 0
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium">ID do Produto</th>
                    <th className="text-left py-3 px-4 font-medium">Nome</th>
                    <th className="text-left py-3 px-4 font-medium">Data de Publicação</th>
                    <th className="text-left py-3 px-4 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.productId}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(item.publishedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setCacheItems((prev) =>
                                prev.filter((i) => i.id !== item.id)
                              );
                              toast.success("Item removido do cache");
                            }}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                        {cacheItems.length === 0
                          ? "Cache vazio"
                          : "Nenhum resultado encontrado"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
