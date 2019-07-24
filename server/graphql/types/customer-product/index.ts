import { Filter, Pagination, Sorting } from '@things-factory/shell'
import { ProductList } from '@things-factory/product-base'

export const Query = `
  customerProducts(filters: [Filter], pagination: Pagination, sortings: [Sorting]): ProductList
`
export const Types = [Filter, Pagination, Sorting, ProductList]
