import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function Pagination({ page, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  if (totalItems <= pageSize) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const goToPage = (nextPage) => onPageChange(Math.min(totalPages, Math.max(1, nextPage)));

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={item === page ? "active" : ""}
          onClick={() => goToPage(item)}
          aria-current={item === page ? "page" : undefined}
        >
          {item}
        </button>
      ))}
      <button type="button" onClick={() => goToPage(page + 1)} disabled={page === totalPages} aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
