import React, { useMemo } from "react";
import { Customer, SaleRecord } from "../types";
import { TrendingUp, ShoppingBag, Users, DollarSign, Award, ArrowUpRight, MessageSquare, Zap } from "lucide-react";

interface DashboardProps {
  customers: Customer[];
  sales: SaleRecord[];
  onSelectCustomer: (customerId: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ customers, sales, onSelectCustomer, onNavigate }: DashboardProps) {
  // Calculations
  const totalRevenue = useMemo(() => {
    return sales.reduce((acc, sale) => acc + sale.value, 0);
  }, [sales]);

  const totalSalesCount = sales.length;

  const totalMessagesHandled = useMemo(() => {
    return customers.reduce((acc, cust) => acc + cust.messageCount, 0);
  }, [customers]);

  const conversionRate = useMemo(() => {
    if (customers.length === 0) return 0;
    // Count customers with at least one sale (totalSpent > 0 or matching sales list)
    const buyersCount = customers.filter(
      (c) => c.totalSpent > 0 || sales.some((s) => s.customerPhone === c.phone)
    ).length;
    return Math.round((buyersCount / customers.length) * 100);
  }, [customers, sales]);

  // Sort customers by lead score to show "Principais Clientes"
  const topClients = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, 5);
  }, [customers]);

  // Product sales breakdown for charts
  const productSales = useMemo(() => {
    const counts: Record<string, { quantity: number; totalValue: number }> = {};
    sales.forEach((s) => {
      if (!counts[s.product]) {
        counts[s.product] = { quantity: 0, totalValue: 0 };
      }
      counts[s.product].quantity += 1;
      counts[s.product].totalValue += s.value;
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      value: data.totalValue,
    }));
  }, [sales]);

  // Visual helper for Lead Score colors
  const getLeadScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
          <Zap className="w-3 h-3 fill-current text-red-500" />
          Fervendo ({score})
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
          <TrendingUp className="w-3 h-3 text-amber-500" />
          Quente ({score})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-100">
          Frio ({score})
        </span>
      );
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* WhatsApp Connection Alert Banner when there are no customers */}
      {customers.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm" id="no-connection-banner">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Seu WhatsApp está Desconectado</h4>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Para começar a receber mensagens de clientes em tempo real e ver as respostas automáticas do robô funcionando, por favor realize a conexão do seu WhatsApp na aba Conexão.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("connect")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
          >
            Conectar WhatsApp Agora
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-slate-200 hover:shadow-md" id="stat-revenue">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Faturamento do Robô</p>
            <h3 className="text-2xl font-bold text-slate-900">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span>+14.2%</span>
              <span className="text-slate-400">vs semana anterior</span>
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Sales Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-slate-200 hover:shadow-md" id="stat-sales">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Vendas Automatizadas</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalSalesCount}</h3>
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <span>Robô ativo</span>
              <span className="text-slate-400">100% automático</span>
            </p>
          </div>
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Top Clients count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-slate-200 hover:shadow-md" id="stat-clients">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Contatos Atendidos</p>
            <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <span>{customers.filter(c => c.unreadCount > 0).length} aguardando</span>
              <span className="text-slate-400">resposta</span>
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-slate-200 hover:shadow-md" id="stat-conversion">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Taxa de Conversão</p>
            <h3 className="text-2xl font-bold text-slate-900">{conversionRate}%</h3>
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <span>{totalMessagesHandled}</span>
              <span className="text-slate-400">mensagens tratadas</span>
            </p>
          </div>
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-grid">
        {/* Sales Performance Chart (SVG Based) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm lg:col-span-2 space-y-4" id="sales-chart-card">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-slate-900">Desempenho de Vendas do Robô</h4>
              <p className="text-xs text-slate-500">Faturamento acumulado das últimas transações realizadas</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                Vendas por Pix/Crédito
              </span>
            </div>
          </div>

          {/* SVG Custom Line/Area Chart */}
          <div className="h-52 w-full pt-4 flex flex-col justify-between" id="svg-chart-container">
            {sales.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Nenhuma venda registrada para desenhar o gráfico.
              </div>
            ) : (
              <div className="relative h-44 w-full">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                </div>

                {/* SVG Polyline representing sales values */}
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Draw the area first */}
                  <path
                    d={`M 0,176 
                        ${sales.map((s, idx) => {
                          const x = (idx / Math.max(1, sales.length - 1)) * 100; // Percentage width
                          // Normalize value (max value 250 for scale)
                          const maxVal = Math.max(...sales.map(s => s.value), 200);
                          const y = 176 - (s.value / maxVal) * 140; 
                          return `L ${x}%,${y}`;
                        }).join(" ")} 
                        L 100%,176 Z`}
                    fill="url(#chartGradient)"
                  />
                  {/* Draw the stroke line */}
                  <path
                    d={sales.map((s, idx) => {
                      const x = (idx / Math.max(1, sales.length - 1)) * 100;
                      const maxVal = Math.max(...sales.map(s => s.value), 200);
                      const y = 176 - (s.value / maxVal) * 140;
                      return `${idx === 0 ? "M" : "L"} ${x}%,${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Draw points on line */}
                  {sales.map((s, idx) => {
                    const x = `${(idx / Math.max(1, sales.length - 1)) * 100}%`;
                    const maxVal = Math.max(...sales.map(s => s.value), 200);
                    const y = 176 - (s.value / maxVal) * 140;
                    return (
                      <g key={s.id} className="group cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#ffffff"
                          stroke="#6366f1"
                          strokeWidth="3"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          fill="#6366f1"
                          fillOpacity="0.1"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis indicators */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2 text-[10px] font-mono text-slate-400">
                  {sales.map((s, idx) => {
                    const date = new Date(s.timestamp);
                    const label = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    return <span key={s.id}>{label}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Sales Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4" id="products-breakdown-card">
          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-slate-900">Produtos Mais Vendidos</h4>
            <p className="text-xs text-slate-500">Ranking de vendas efetuadas pelo robô</p>
          </div>

          <div className="space-y-4 pt-2" id="products-progress-bars">
            {productSales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhum produto vendido ainda.
              </div>
            ) : (
              productSales
                .sort((a, b) => b.quantity - a.quantity)
                .map((prod, idx) => {
                  const maxQty = Math.max(...productSales.map((p) => p.quantity));
                  const percentWidth = (prod.quantity / maxQty) * 100;
                  const colors = ["bg-indigo-600", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={prod.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span className="truncate pr-4">{prod.name}</span>
                        <span className="font-semibold shrink-0">
                          {prod.quantity}x (R$ {prod.value.toFixed(2)})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${percentWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="leads-sales-grid">
        {/* Principais Clientes / Leads Fervendo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-5 flex flex-col" id="top-leads-card">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-indigo-600" />
                Principais Clientes do Momento
              </h4>
              <p className="text-xs text-slate-500">Clientes com maior engajamento e intenção de compra</p>
            </div>
            <button
              onClick={() => onNavigate("chats")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5"
            >
              Ver todos
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1" id="top-leads-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                  <th className="pb-3 pt-1">Cliente</th>
                  <th className="pb-3 pt-1">Score de Engajamento</th>
                  <th className="pb-3 pt-1">Mensagens</th>
                  <th className="pb-3 pt-1 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {topClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={client.avatar}
                          alt={client.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{client.name}</p>
                          <p className="text-xs text-slate-400">{client.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{getLeadScoreBadge(client.leadScore)}</td>
                    <td className="py-3 text-slate-500 font-mono text-xs pl-2">
                      {client.messageCount} msgs
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectCustomer(client.id)}
                        className="p-1 px-2.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Atender
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Automated Sales List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col space-y-4 overflow-hidden" id="recent-sales-card">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-slate-900">Vendas Recentes do Robô</h4>
              <p className="text-xs text-slate-500">Últimas conversas que resultaram em receita automatizada</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
              Live Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]" id="recent-sales-list">
            {sales.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Nenhuma venda registrada ainda. Ligue o robô e simule um atendimento!
              </div>
            ) : (
              [...sales]
                .reverse()
                .map((sale) => {
                  const date = new Date(sale.timestamp);
                  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

                  return (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                          <ShoppingBag className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-slate-900 truncate max-w-[180px]">
                            {sale.product}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sale.customerName} • {dateStr} às {timeStr}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-emerald-600">
                          + R$ {sale.value.toFixed(2)}
                        </span>
                        <p className="text-[10px] font-semibold text-emerald-500 uppercase leading-none">
                          Sucesso
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
