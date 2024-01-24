export type PaginationMetaData = {
    totalPages: number,
    totalItems: number,
    currentPage: number,
    pageSize: number
}

export type RestPaginationMetaData = PaginationMetaData & {
    links: {
        first: string,
        prev: string,
        next: string,
        last: string
    }
}

export interface IPaginator<T extends PaginationMetaData = PaginationMetaData> {
    getPageSize(): number;
    setPageSize(size: number): void;
    buildMetaData(currentPage: number, totalItems: number): T;
}
