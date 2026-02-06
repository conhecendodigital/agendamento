// Nomes dos meses em português
export const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Nomes abreviados dos dias da semana em português
export const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Nomes completos dos dias da semana em português
export const dayNamesFull = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
];

// Formatar data como DD/MM/AAAA
export const formatDateBR = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Formatar data como "06 de Fevereiro de 2026"
export const formatDateLong = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
};

// Formatar data completa como "Sexta-feira, 06 de Fevereiro de 2026"
export const formatDateFull = (date: Date): string => {
    const dayName = dayNamesFull[date.getDay()];
    return `${dayName}, ${formatDateLong(date)}`;
};

// Formatar horário como HH:MM
export const formatTime = (time: string): string => {
    return time.substring(0, 5);
};

// Obter primeiro dia do mês (0 = Domingo, 1 = Segunda, etc.)
export const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
};

// Obter número de dias no mês
export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

// Verificar se duas datas são o mesmo dia
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

// Verificar se é hoje
export const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
};

// Converter data para string YYYY-MM-DD (formato do Supabase)
export const toDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Converter string YYYY-MM-DD para Date
export const fromDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Obter array de datas para o calendário do mês (inclui dias do mês anterior/posterior)
export const getCalendarDays = (year: number, month: number): Date[] => {
    const days: Date[] = [];
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    // Dias do próximo mês (completar 42 dias = 6 semanas)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push(new Date(year, month + 1, i));
    }

    return days;
};

// Obter array de datas para a semana
export const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const dayOfWeek = date.getDay();
    const start = new Date(date);
    start.setDate(start.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        days.push(day);
    }

    return days;
};

// Gerar array de horários (6:00 às 23:00)
export const getTimeSlots = (intervalMinutes: number = 60): string[] => {
    const slots: string[] = [];
    for (let hour = 6; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
    }
    return slots;
};

// Calcular posição vertical de um horário no calendário (0-100%)
export const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - 6) * 60 + minutes;
    const totalRange = 18 * 60; // 6:00 às 24:00 = 18 horas
    return (totalMinutes / totalRange) * 100;
};

// Calcular altura de um bloco de reunião (em %)
export const getMeetingHeight = (startTime: string, endTime: string): number => {
    const startPos = getTimePosition(startTime);
    const endPos = getTimePosition(endTime);
    return endPos - startPos;
};
