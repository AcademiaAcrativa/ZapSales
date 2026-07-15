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
  const [progressStep, setProgressStep] = useState(0);
  const [countdown, setCountdown] = useState(45);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`]);
  };

  // Simulated connection steps
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "connecting") {
      setProgressStep(1);
      setLogs([]);
      addLog("Iniciando instância segura do navegador headless...");
      
      timer = setTimeout(() => {
        setProgressStep(2);
        addLog("WhatsApp Web v2.3000.10129 carregado.");
        addLog("Gerando par de chaves e QR Code de autenticação...");
      }, 1000);

      const timer2 = setTimeout(() => {
        setProgressStep(3);
        addLog("QR Code pronto! Aguardando escaneamento no aplicativo do celular...");
      }, 2500);

      const timer3 = setTimeout(() => {
        setProgressStep(4);
        addLog("Autenticação detectada! Iniciando aperto de mão seguro (Handshake)...");
        addLog("Sincronizando contatos e histórico de mensagens recentes...");
      }, 5000);

      const timer4 = setTimeout(() => {
        onStatusChange("connected");
        addLog("Conexão estabelecida com sucesso! Robô pronto para atendimento.");
      }, 7000);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [status]);

  // QR Code expiration countdown simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "disconnected") {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            addLog("QR Code expirado. Gerando novo token...");
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleStartConnection = () => {
    onStatusChange("connecting");
  };

  const handleDisconnect = () => {
    onStatusChange("disconnected");
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString("pt-BR")}] [ZAPBOT] Sessão encerrada pelo usuário.`
    ]);
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
          <div className="flex flex-col md:flex-row items-center gap-6 py-4" id="disconnected-qr-panel">
            {/* QR Code Graphic Representation */}
            <div className="relative group shrink-0 border-2 border-indigo-100 p-4 rounded-2xl bg-slate-50 shadow-inner flex flex-col items-center">
              <div className="relative w-44 h-44 bg-white rounded-lg flex items-center justify-center p-2 border border-slate-200">
                {/* Simulated QR Code using CSS and SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="25" height="25" fill="currentColor" rx="2" />
                  <rect x="9" y="9" width="17" height="17" fill="white" rx="1" />
                  <rect x="13" y="13" width="9" height="9" fill="currentColor" rx="0.5" />

                  <rect x="70" y="5" width="25" height="25" fill="currentColor" rx="2" />
                  <rect x="74" y="9" width="17" height="17" fill="white" rx="1" />
                  <rect x="78" y="13" width="9" height="9" fill="currentColor" rx="0.5" />

                  <rect x="5" y="70" width="25" height="25" fill="currentColor" rx="2" />
                  <rect x="9" y="74" width="17" height="17" fill="white" rx="1" />
                  <rect x="13" y="78" width="9" height="9" fill="currentColor" rx="0.5" />

                  {/* Random pixels */}
                  <rect x="40" y="5" width="10" height="5" fill="currentColor" />
                  <rect x="45" y="15" width="15" height="10" fill="currentColor" />
                  <rect x="35" y="28" width="8" height="8" fill="currentColor" />
                  <rect x="5" y="35" width="15" height="10" fill="currentColor" />
                  <rect x="25" y="35" width="20" height="5" fill="currentColor" />
                  <rect x="50" y="35" width="10" height="15" fill="currentColor" />
                  <rect x="5" y="55" width="10" height="5" fill="currentColor" />
                  <rect x="20" y="50" width="15" height="15" fill="currentColor" />
                  <rect x="40" y="60" width="5" height="10" fill="currentColor" />
                  <rect x="50" y="55" width="15" height="10" fill="currentColor" />
                  <rect x="70" y="40" width="25" height="10" fill="currentColor" />
                  <rect x="75" y="55" width="15" height="15" fill="currentColor" />
                  <rect x="70" y="75" width="10" height="10" fill="currentColor" />
                  <rect x="85" y="70" width="10" height="10" fill="currentColor" />
                  <rect x="85" y="85" width="10" height="10" fill="currentColor" />

                  {/* Center branding icon anchor */}
                  <rect x="42" y="42" width="16" height="16" fill="white" rx="2" />
                </svg>
                {/* Simulated center Logo */}
                <div className="absolute bg-indigo-600 rounded p-1 text-white shadow-md">
                  <Phone className="w-4 h-4 fill-current" />
                </div>
              </div>

              {/* Countdown overlay/badge */}
              <div className="mt-3.5 text-center">
                <p className="text-[10px] font-semibold text-slate-400">
                  Expira em <span className="font-mono text-indigo-600 font-bold">{countdown}s</span>
                </p>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-4">
              <h5 className="font-bold text-sm text-slate-800">Siga as instruções para conectar:</h5>
              <ol className="space-y-3 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
                <li>Abra o <strong>WhatsApp</strong> no seu celular comercial ou pessoal.</li>
                <li>Toque em <strong>Mais opções</strong> (três pontinhos) ou <strong>Configurações</strong> e selecione <strong>Aparelhos conectados</strong>.</li>
                <li>Toque em <strong>Conectar um aparelho</strong>.</li>
                <li>Aponte a câmera do seu celular para o QR Code ao lado para sincronizar o bot!</li>
              </ol>

              <button
                onClick={handleStartConnection}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                <QrCode className="w-4 h-4" />
                Simular Leitura do QR Code
              </button>
            </div>
          </div>
        )}

        {status === "connecting" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-5" id="connecting-panel">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              <Phone className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-center space-y-1.5 max-w-sm">
              <h5 className="font-bold text-sm text-slate-800">
                {progressStep === 1 && "Iniciando Canal Headless..."}
                {progressStep === 2 && "Carregando Zap Web..."}
                {progressStep === 3 && "Aguardando Confirmação..."}
                {progressStep === 4 && "Handshake de Chaves..."}
              </h5>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressStep * 25}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400">
                {progressStep === 1 && "Estabelecendo túnel seguro com o provedor."}
                {progressStep === 2 && "Sincronizando bibliotecas do protocolo WA."}
                {progressStep === 3 && "Verificando assinatura digital do dispositivo."}
                {progressStep === 4 && "Baixando dados de chats. Quase pronto!"}
              </p>
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
                <p className="flex justify-between">
                  <span className="text-slate-400">Canal Ativo:</span>
                  <span className="font-semibold text-slate-800">+55 (11) 98765-4321</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Tipo de Conta:</span>
                  <span className="font-semibold text-indigo-600 font-mono text-[10px] bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">
                    WA BUSINESS
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Hora Conexão:</span>
                  <span className="font-semibold text-slate-800">Hoje, {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </p>
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full text-center py-2 rounded-xl text-xs font-semibold text-rose-600 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors"
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
