import React, { useState, useMemo } from "react";
import { TrendingUp, Calendar } from "lucide-react";

interface VisitsChartProps {
  views: {
    total: number;
    lastWeek: number;
    lastMonth: number;
    trend: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ date: string; count: number }>;
    monthly: Array<{ date: string; count: number }>;
    yearly: Array<{ date: string; count: number }>;
  };
}

type Period = 'day' | 'week' | 'month' | 'year';

export default function VisitsChart({ views }: VisitsChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  // Calcular el total para cada período basado en los datos reales
  const periodTotals = useMemo(() => ({
    day: views.daily.reduce((sum, item) => sum + item.count, 0),
    week: views.weekly.reduce((sum, item) => sum + item.count, 0),
    month: views.monthly.reduce((sum, item) => sum + item.count, 0),
    year: views.yearly.reduce((sum, item) => sum + item.count, 0),
  }), [views]);

  const periods = [
    { id: 'day' as Period, label: 'Día', value: periodTotals.day },
    { id: 'week' as Period, label: 'Semana', value: periodTotals.week },
    { id: 'month' as Period, label: 'Mes', value: periodTotals.month },
    { id: 'year' as Period, label: 'Año', value: periodTotals.year },
  ];

  const selectedData = periods.find(p => p.id === selectedPeriod);

  // Obtener los datos del gráfico basados en el período seleccionado
  const getChartData = useMemo(() => {
    const formatLabel = (dateStr: string, period: Period, index: number) => {
      // Usar la fecha local del navegador en lugar de UTC
      const date = new Date(dateStr);
      
      switch (period) {
        case 'day':
          // Formato de 24 horas
          const hours = date.getHours();
          return `${String(hours).padStart(2, '0')}h`;
        case 'week':
          const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          return days[date.getDay()];
        case 'month':
          // Mostrar Sem 1, Sem 2, Sem 3, Sem 4
          return `Sem ${index + 1}`;
        case 'year':
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return months[date.getMonth()];
        default:
          return '';
      }
    };

    let data: Array<{ date: string; count: number }> = [];
    
    switch (selectedPeriod) {
      case 'day':
        data = views.daily;
        break;
      case 'week':
        data = views.weekly;
        break;
      case 'month':
        data = views.monthly;
        break;
      case 'year':
        data = views.yearly;
        break;
    }

    return data.map((item, index) => ({
      label: formatLabel(item.date, selectedPeriod, index),
      value: item.count,
    }));
  }, [selectedPeriod, views]);

  const chartMax = Math.max(...getChartData.map(d => d.value), 1);

  return (
    <div className="dashboard-card visits-chart">
      <div className="card-header">
        <h3 className="card-title">
          <TrendingUp size={20} />
          Visitas Totales
        </h3>
        <div className="period-selector">
          {periods.map(period => (
            <button
              key={period.id}
              className={`period-button ${selectedPeriod === period.id ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="visits-summary">
        <div className="visits-count">
          <span className="count-number">{selectedData?.value || 0}</span>
          <span className="count-label">visitas en {selectedData?.label.toLowerCase()}</span>
        </div>
        {views.trend !== 0 && (
          <div className={`trend-indicator ${views.trend > 0 ? 'positive' : 'negative'}`}>
            {views.trend > 0 ? '↑' : '↓'} {Math.abs(views.trend)}%
          </div>
        )}
      </div>

      <div className="chart-container">
        <div className="chart-bars">
          {getChartData.map((item, index) => {
            // Calcular altura usando el máximo del período (no un valor fijo)
            // Esto hace que la barra más alta siempre ocupe el 100% del espacio
            const heightPercentage = chartMax === 0 
              ? 0 
              : (item.value / chartMax) * 100;
            
            return (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar"
                    style={{ 
                      height: `${heightPercentage}%`
                    }}
                    title={`${item.label}: ${item.value} visitas`}
                  >
                    {item.value > 0 && (
                      <span className="bar-value">{item.value}</span>
                    )}
                  </div>
                </div>
                <span className="chart-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-footer">
        <div className="footer-info">
          <Calendar size={16} />
          <span>Mostrando datos de {selectedData?.label.toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
}
