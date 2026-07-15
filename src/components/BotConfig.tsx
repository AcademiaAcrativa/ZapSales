import React, { useState } from "react";
import { BotSettings, CustomTrigger } from "../types";
import { Save, Sparkles, Plus, Trash2, HelpCircle, CheckCircle, AlertCircle } from "lucide-react";

interface BotConfigProps {
  settings: BotSettings;
  onSaveSettings: (settings: BotSettings) => void;
  triggers: CustomTrigger[];
  onAddTrigger: (trigger: Omit<CustomTrigger, "id">) => void;
  onDeleteTrigger: (id: string) => void;
}

export default function BotConfig({
  settings,
  onSaveSettings,
  triggers,
  onAddTrigger,
  onDeleteTrigger,
}: BotConfigProps) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [businessType, setBusinessType] = useState(settings.businessType);
  const [botRules, setBotRules] = useState(settings.botRules);
  const [autoReply, setAutoReply] = useState(settings.autoReply);
  const [isSmartMode, setIsSmartMode] = useState(settings.isSmartMode);

  // Success state for settings saved
  const [showSavedToast, setShowSavedToast] = useState(false);

  // New trigger form states
  const [newKeyword, setNewKeyword] = useState("");
  const [newReply, setNewReply] = useState("");
  const [simulateSale, setSimulateSale] = useState(false);
  const [saleProduct, setSaleProduct] = useState("");
  const [saleValue, setSaleValue] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      companyName,
      businessType,
      botRules,
      autoReply,
      isSmartMode,
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleAddTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newReply.trim()) return;

    onAddTrigger({
      keyword: newKeyword.trim(),
      reply: newReply.trim(),
      simulateSale,
      saleProduct: simulateSale ? saleProduct.trim() : "",
      saleValue: simulateSale ? Number(saleValue) || 0 : 0,
    });

    // Reset form states
    setNewKeyword("");
    setNewReply("");
    setSimulateSale(false);
    setSaleProduct("");
    setSaleValue("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="config-container">
      {/* Bot Settings Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-slate-900">Configurações Gerais do Robô</h4>
              <p className="text-xs text-slate-500">Defina o comportamento e regras do assistente virtual</p>
            </div>
            {isSmartMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="w-3 h-3 fill-current" />
                Modo IA Ativo
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5" id="settings-form">
            {/* Store Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Bella Modas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nicho / Ramo de Atuação</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Ex: Vestuário e Moda Feminina"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Smart Mode Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                  Atendimento Inteligente com IA
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Usa o modelo <strong>Gemini 3.5 Flash</strong> para manter conversas complexas, tirar dúvidas e fechar vendas de maneira fluida. Caso desligado, usará estritamente os gatilhos por palavra-chave.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isSmartMode}
                  onChange={(e) => setIsSmartMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Default Automated Reply */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Mensagem Automática de Boas-vindas
                </label>
                <span className="text-[10px] font-mono text-slate-400">Disparada no primeiro contato</span>
              </div>
              <textarea
                value={autoReply}
                onChange={(e) => setAutoReply(e.target.value)}
                rows={3}
                placeholder="Ex: Olá! Seja bem-vindo à nossa loja..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                required
              />
            </div>

            {/* AI Rules (Only show or highlight if Smart Mode is active) */}
            <div className={`space-y-1.5 transition-opacity ${isSmartMode ? "opacity-100" : "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Instruções e Regras de Venda do Robô {isSmartMode && " (IA)"}
                </label>
                <span className="text-[10px] font-mono text-slate-400">Diretrizes de vendas para o robô</span>
              </div>
              <textarea
                value={botRules}
                onChange={(e) => setBotRules(e.target.value)}
                rows={4}
                placeholder="Diga à IA como falar com os clientes, quais produtos priorizar e qual tom utilizar..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                disabled={!isSmartMode}
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                *Dica: Escreva regras como "Ofereça frete grátis se comprar 2 peças" ou "Tente vender o produto X que custa R$ Y". O robô usará isso para convencer o cliente e registrar a venda!
              </p>
            </div>

            {/* Save Button & Feedback */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {showSavedToast && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                    <CheckCircle className="w-4 h-4" />
                    Configurações salvas com sucesso!
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Triggers and Keywords Column */}
      <div className="space-y-6">
        {/* Trigger Creator Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-slate-900">Novo Gatilho de Resposta</h4>
            <p className="text-xs text-slate-500">Crie regras por palavra-chave para respostas rápidas</p>
          </div>

          <form onSubmit={handleAddTriggerSubmit} className="space-y-3.5" id="add-trigger-form">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Se o cliente mandar a palavra:</label>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Ex: Preço, Catálogo, Endereço"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-indigo-700 placeholder:font-normal"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">O robô responde automaticamente:</label>
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows={3}
                placeholder="Escreva a resposta automática para esse gatilho..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                required
              />
            </div>

            {/* Simulate Sale configuration */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateSale}
                  onChange={(e) => setSimulateSale(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">Simular venda neste gatilho?</span>
              </label>

              {simulateSale && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Nome do Produto</label>
                    <input
                      type="text"
                      value={saleProduct}
                      onChange={(e) => setSaleProduct(e.target.value)}
                      placeholder="Ex: Vestido Verão"
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      required={simulateSale}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={saleValue}
                      onChange={(e) => setSaleValue(e.target.value)}
                      placeholder="119.90"
                      className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono"
                      required={simulateSale}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar Gatilho
            </button>
          </form>
        </div>

        {/* Triggers List Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Gatilhos Ativos ({triggers.length})</h4>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1" id="active-triggers-list">
            {triggers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhum gatilho personalizado criado ainda.
              </div>
            ) : (
              triggers.map((trig) => (
                <div
                  key={trig.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between group"
                >
                  <div className="space-y-1 pr-4 max-w-[80%]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] uppercase">
                        {trig.keyword}
                      </span>
                      {trig.simulateSale && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[9px] font-semibold border border-emerald-100">
                          Venda: R${trig.saleValue.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                      "{trig.reply}"
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteTrigger(trig.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Excluir gatilho"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
