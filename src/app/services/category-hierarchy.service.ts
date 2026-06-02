import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CategoriesService } from './categories.service';
import { SubCategoriesService } from './sub-categories.service';
import { Category } from '../models/category.model';

export interface SubCategoryItem {
  titleList: string;
  subcategory: string;
  url: string;
  category?: string;
}

export interface CategoryWithSubcategories {
  category: Category;
  titleList: string[];
  subcategories: SubCategoryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryHierarchyService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly subCategoriesService: SubCategoriesService
  ) {}

  getCategoriesWithSubcategories(): Observable<CategoryWithSubcategories[]> {
    return this.categoriesService.getData().pipe(
      switchMap((categories: Category[]) => {
        const categoryRequests = categories.map((category) =>
          this.buildCategoryHierarchy(category)
        );
        return forkJoin(categoryRequests);
      })
    );
  }

  private buildCategoryHierarchy(category: Category): Observable<CategoryWithSubcategories> {
    const titleList = this.parseTitleList(category);

    if (titleList.length === 0) {
      return of({
        category,
        titleList: [],
        subcategories: []
      });
    }

    const subcategoryRequests = titleList.map((title) =>
      this.subCategoriesService.getFilterData('title_list', title).pipe(
        map((subcategories) =>
          this.mapSubcategoriesToItems(subcategories, title)
        )
      )
    );

    return forkJoin(subcategoryRequests).pipe(
      map((allSubcategories) => ({
        category,
        titleList,
        subcategories: allSubcategories.flat()
      }))
    );
  }

  private parseTitleList(category: any): string[] {
    try {
      if (category.title_list) {
        return typeof category.title_list === 'string'
          ? JSON.parse(category.title_list)
          : category.title_list;
      }
      return [];
    } catch {
      return [];
    }
  }

  private mapSubcategoriesToItems(
    subcategories: any[],
    titleList: string
  ): SubCategoryItem[] {
    if (!subcategories || !Array.isArray(subcategories)) {
      return [];
    }

    return Object.values(subcategories).map((item: any) => ({
      titleList: item.title_list || titleList,
      subcategory: item.name || '',
      url: item.url || '',
      category: item.category || ''
    }));
  }

  getFooterCategories(): Observable<Array<{ category: string; subcategories: SubCategoryItem[] }>> {
    return this.categoriesService.getData().pipe(
      switchMap((categories: Category[]) => {
        const requests = categories.map((category) =>
          this.subCategoriesService
            .getFilterData('category', category.name)
            .pipe(
              map((subcategories) => ({
                category: category.name,
                subcategories: this.mapSubcategoriesToItems(subcategories, category.name)
              }))
            )
        );
        return forkJoin(requests);
      })
    );
  }
}
