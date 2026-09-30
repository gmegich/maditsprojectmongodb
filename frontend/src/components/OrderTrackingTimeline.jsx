const OrderTrackingTimeline = ({ tracking }) => {
  if (!tracking) return null;

  return (
    <section className="tracking-panel">
      <div className="tracking-panel__header">
        <h2>Order tracking</h2>
        <p>{tracking.estimatedMessage}</p>
      </div>

      {tracking.isCancelled ? (
        <p className="form-alert">This order was cancelled.</p>
      ) : (
        <ol className="tracking-timeline">
          {tracking.timeline.map((step) => (
            <li
              key={step.status}
              className={`tracking-step ${
                step.completed ? 'tracking-step--done' : ''
              } ${step.current ? 'tracking-step--current' : ''}`}
            >
              <span className="tracking-step__dot" aria-hidden="true" />
              <div>
                <strong>{step.status}</strong>
                {step.at && (
                  <p className="hint-text">{new Date(step.at).toLocaleString()}</p>
                )}
                {step.note && <p className="hint-text">{step.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {tracking.history?.length > 0 && (
        <div className="tracking-history">
          <h3>Status history</h3>
          <ul className="simple-list">
            {[...tracking.history].reverse().map((entry, index) => (
              <li key={`${entry.status}-${entry.at || index}`}>
                <span>
                  <strong>{entry.status}</strong>
                  {entry.note ? ` — ${entry.note}` : ''}
                </span>
                <span>{entry.at ? new Date(entry.at).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default OrderTrackingTimeline;
