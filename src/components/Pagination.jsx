import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function Pagination({ page, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / pageSize));

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      onPageChange(totalPages);
    }
  }, [page, totalPages, onPageChange]);

  if (!totalItems || totalItems <= 0) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const goToPage = (nextPage) => {
    const target = Math.min(totalPages, Math.max(1, nextPage));
    if (target !== page) {
      onPageChange(target);
    }
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 24 }}>
      <p style={{ color: "#2d6a4f", fontSize: "0.88rem", fontWeight: 650, margin: 0 }}>
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> plants
      </p>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            style={{ cursor: page === 1 ? "not-allowed" : "pointer" }}
          >
            <ChevronLeft size={18} />
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

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            style={{ cursor: page === totalPages ? "not-allowed" : "pointer" }}
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </div>
  );
}
