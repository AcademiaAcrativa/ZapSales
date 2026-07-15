import React, { useState, useEffect } from "react";
import { ConnectionStatus } from "../types";
import { QrCode, Wifi, Battery, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Terminal, Phone } from "lucide-react";

interface WhatsAppConnectProps {
  status: ConnectionStatus;
  onStatusChange: (status: ConnectionStatus) => void;
}

export default function WhatsAppConnect({ status, onStatusChange }: WhatsAppConnectProps) {
  const [logs, setLogs] = useState<string[]>([
    "[ZAPBOT] Sistema pronto para inicialização.",
    "[ZAPBOT] Aguardando clique para gerar canal seguro..."
  ]);
  const [realQr, setRealQr] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`]);
  };

  // Poll connection status & QR code from backend
  useEffect(() => {
    let lastStatus = status;
    let lastQr = realQr;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          
          if (data.status !== lastStatus) {
            if (data.status === "connecting") {
              addLog("Iniciando conexão com o WhatsApp no servidor...");
            } else if (data.status === "connected") {
              addLog("📡 Conexão estabelecida com sucesso! Robô ativo para atendimento.");
            } else if (data.status === "disconnected") {
              addLog("⚠️ WhatsApp desconectado ou deslogado.");
            }
            lastStatus = data.status;
            onStatusChange(data.status);
          }

          if (data.qr !== lastQr) {
            if (data.qr) {
              addLog("Novo QR Code gerado pelo servidor. Por favor, escaneie com seu celular.");
            }
            lastQr = data.qr;
            setRealQr(data.qr);
          }
        }
      } catch (err) {
        // silent error
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, [onStatusChange, status, realQr]);

  const handleStartConnection = async () => {
    onStatusChange("connecting");
    addLog("Iniciando conexão com o WhatsApp...");
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      if (res.ok) {
        addLog("Conexão iniciada. Aguardando QR Code...");
      } else {
        addLog("Erro ao solicitar conexão ao servidor.");
      }
    } catch (err) {
      addLog("Erro de rede ao solicitar conexão.");
    }
  };

  const handleDisconnect = async () => {
    onStatusChange("disconnected");
    addLog("Desconectando sessão do WhatsApp comercial...");
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      if (res.ok) {
        addLog("Sessão desconectada com sucesso do servidor.");
      }
    } catch (err) {
      addLog("Erro ao desconectar sessão no servidor.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="whatsapp-connect-container">
      {/* QR Code and Status Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-slate-900">Conectar WhatsApp do Vendedor</h4>
            <p className="text-xs text-slate-500">Conecte sua conta pessoal ou comercial em menos de 1 minuto</p>
          </div>
          {status === "connected" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
              <Wifi className="w-3.5 h-3.5" />
              Conectado
            </span>
          ) : status === "connecting" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Conectando...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
              Desconectado
            </span>
          )}
        </div>

        {/* Dynamic Display based on State */}
        {status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-5" id="start-connection-panel">
            <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-3xl shadow-sm inline-flex">
              <QrCode className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2 max-w-sm">
              <h5 className="font-bold text-base text-slate-800">Conecte seu WhatsApp Real</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clique no botão abaixo para iniciar o processo de conexão e gerar o QR Code de autenticação seguro.
              </p>
            </div>
            <button
              onClick={handleStartConnection}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer font-sans"
            >
              Gerar QR Code de Conexão real
            </button>
          </div>
        )}

        {status === "connecting" && (
          <div className="flex flex-col md:flex-row items-center gap-6 py-4" id="connecting-qr-panel">
            {/* QR Code Graphic Representation */}
            <div className="relative group shrink-0 border-2 border-indigo-100 p-4 rounded-2xl bg-slate-50 shadow-inner flex flex-col items-center">
              <div className="relative w-44 h-44 bg-white rounded-lg flex items-center justify-center p-2 border border-slate-200">
                {realQr ? (
                  <img src={realQr} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-[10px] font-semibold">Gerando QR...</span>
                  </div>
                )}
              </div>

              {realQr && (
                <div className="mt-3.5 text-center">
                  <p className="text-[10px] font-semibold text-indigo-600 font-bold">
                    Escaneie agora mesmo!
                  </p>
                </div>
              )}
            </div>

            {/* Instruction Steps */}
            <div className="space-y-4 flex-1">
              <h5 className="font-bold text-sm text-slate-800">Siga as instruções para conectar:</h5>
              <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
                <li>Abra o <strong>WhatsApp</strong> no seu celular comercial ou pessoal.</li>
                <li>Toque em <strong>Mais opções</strong> (três pontinhos) ou <strong>Configurações</strong> e selecione <strong>Aparelhos conectados</strong>.</li>
                <li>Toque em <strong>Conectar um aparelho</strong>.</li>
                <li>Aponte a câmera do seu celular para o QR Code ao lado para sincronizar o bot!</li>
              </ol>

              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-rose-600 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar Conexão
              </button>
            </div>
          </div>
        )}

        {status === "connected" && (
          <div className="py-6 flex flex-col md:flex-row items-center gap-6 justify-around" id="connected-panel">
            {/* Active Device Info Panel */}
            <div className="space-y-4 max-w-xs text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h5 className="font-bold text-base text-slate-900 leading-snug">Dispositivo Conectado</h5>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 justify-center md:justify-start">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    Ativo & Monitorando
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600" id="session-metadata">
                <p className="flex justify-between gap-4">
                  <span className="text-slate-400">Canal Ativo:</span>
                  <span className="font-semibold text-slate-800">Seu WhatsApp Conectado</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-slate-400">Tipo de Conta:</span>
                  <span className="font-semibold text-indigo-600 font-mono text-[10px] bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">
                    WA MULTI-DEVICE
                  </span>
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-slate-400">Hora Conexão:</span>
                  <span className="font-semibold text-slate-800">Hoje, {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </p>
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-rose-600 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Desconectar Sessão
              </button>
            </div>

            {/* Quick Status Stats (battery/signal) */}
            <div className="grid grid-cols-2 gap-3 shrink-0" id="device-hardware-stats">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 flex flex-col items-center w-28 shadow-sm">
                <Battery className="w-6 h-6 text-emerald-500" />
                <p className="text-[10px] font-semibold text-slate-400 leading-none">Bateria</p>
                <p className="text-sm font-bold text-slate-800 leading-none">88%</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 flex flex-col items-center w-28 shadow-sm">
                <Wifi className="w-6 h-6 text-indigo-500" />
                <p className="text-[10px] font-semibold text-slate-400 leading-none">Sinal Celular</p>
                <p className="text-sm font-bold text-slate-800 leading-none">Excelente</p>
              </div>
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="text-slate-400 text-[11px] leading-relaxed flex items-start gap-1.5 border-t border-slate-100 pt-4 mt-auto">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            Seus dados são transmitidos com criptografia de ponta a ponta. O ZapBot não armazena suas credenciais privadas ou senhas do WhatsApp.
          </p>
        </div>
      </div>

      {/* Terminal logs column */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 text-slate-100 font-mono p-5 shadow-lg flex flex-col space-y-3.5 justify-between h-[360px] lg:h-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Console do Sistema
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        {/* Code Logs Area */}
        <div className="flex-1 overflow-y-auto text-[11px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800" id="terminal-logs">
          {logs.map((log, idx) => (
            <p key={idx} className="leading-relaxed">
              <span className="text-slate-500 select-none">$&gt;</span> {log}
            </p>
          ))}
        </div>

        {/* Clear logs button */}
        <button
          onClick={() => setLogs(["[ZAPBOT] Console reiniciado."])}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors pt-2 border-t border-slate-800 text-left"
        >
          Limpar histórico do console
        </button>
      </div>
    </div>
  );
}
