import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center space-x-2">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link href={`${baseUrl}?page=${currentPage - 1}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      {/* 页码 */}
      {pageNumbers.map((page) => (
        <Link key={page} href={`${baseUrl}?page=${page}`}>
          <Button
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className={cn(
              page === currentPage && "bg-primary text-primary-foreground"
            )}
          >
            {page}
          </Button>
        </Link>
      ))}

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link href={`${baseUrl}?page=${currentPage + 1}`}>
          <Button variant="outline" size="sm">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
