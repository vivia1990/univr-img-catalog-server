import { IPaginator, PaginationMetaData } from '../interfaces/Paginator.js';

export default class Paginator implements IPaginator<PaginationMetaData> {
    protected pageSize: number;

    constructor (pageSize: number = 100) {
        this.pageSize = pageSize;
    }

    getPageSize (): number {
        return this.pageSize;
    }

    setPageSize (size: number): void {
        this.pageSize = size;
    }

    buildMetaData (currentPage: number, totalItems: number) {
        const pageCount = Math.ceil(totalItems / this.pageSize) || 1;

        return {
            totalItems,
            totalPages: pageCount,
            currentPage,
            pageSize: this.pageSize
        };
    }
}
