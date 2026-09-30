const Pagination = ({ page = 1, pages = 1, onPageChange }) => {
  if (pages <= 1) return null;

  const goTo = (nextPage) => {
    if (nextPage < 1 || nextPage > pages || nextPage === page) return;
    onPageChange?.(nextPage);
  };

  return (
    <nav className="pagination" aria-label="Product pages">
      <button type="button" className="btn btn--ghost" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        Previous
      </button>
      <span className="pagination__status">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className="btn btn--ghost"
        disabled={page >= pages}
        onClick={() => goTo(page + 1)}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
