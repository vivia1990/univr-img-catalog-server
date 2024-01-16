import { IPaginator, RestPaginationMetaData } from '../interfaces/Paginator.js';
import Paginator from './Paginator.js';

export default class RestPaginator extends Paginator implements IPaginator<RestPaginationMetaData> {
    private baseUrl: string;
    constructor (baseUrl: string, pageSize: number = 50) {
        super(pageSize);
        this.baseUrl = baseUrl;
    }

    buildMetaData (currentPage: number, totalItems: number) {
        const baseUrl = this.baseUrl;
        const pageCount = Math.floor(totalItems / this.pageSize) || 1;
        const obj = {
            ...super.buildMetaData(currentPage, totalItems),
            ...{
                links: {
                    first: `${baseUrl}?page=1`,
                    prev: currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : '',
                    next: currentPage < pageCount ? `${baseUrl}?page=${currentPage + 1}` : '',
                    last: `${baseUrl}?page=${pageCount}`
                }
            }
        };

        return obj;
    }
}
