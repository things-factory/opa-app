import { ProductList } from '@things-factory/product-base'
import { Filter, Pagination, Sorting } from '@things-factory/shell'

export const Query = `
  ownerProducts(filters: [Filter], pagination: Pagination, sortings: [Sorting]): ProductList
`

export const Types = [Filter, Pagination, Sorting, ProductList]
