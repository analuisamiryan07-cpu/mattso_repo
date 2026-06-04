import useCountUp from '@hooks/useCountUp';

/**
 * Subcomponente de estadística animada.
 * Usa el hook useCountUp para animar el número al entrar en viewport.
 */
const StatItem = ({ end, title }) => {
  const { count, countRef } = useCountUp(end);
  const formatted = count.toLocaleString('es-ES');

  return (
    <div className="stat-item" ref={countRef}>
      <h2 className="stat-number">+{formatted}</h2>
      <p className="stat-title">{title}</p>
    </div>
  );
};

export default StatItem;
