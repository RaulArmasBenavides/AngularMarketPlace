import { Component, OnInit } from '@angular/core';

declare var jQuery: any;
declare var $: any;

import { CategoriesService } from '../../services/categories.service';
import { SubCategoriesService } from '../../services/sub-categories.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-header-mobile',
	templateUrl: './header-mobile.component.html',
	styleUrls: ['./header-mobile.component.css'],
	standalone: false
})
export class HeaderMobileComponent implements OnInit {
	path: string = environment.assets;
	categories: Object = new Object();
	render: boolean = true;
	categoriesList: Array<any> = [];

	constructor(
		private readonly categoriesService: CategoriesService,
		private readonly subCategoriesService: SubCategoriesService
	) {}

	ngOnInit(): void {
		/*=============================================
		Tomamos la data de las categorías
    =============================================*/
		this.categoriesService.getData().subscribe((resp:any) => {
			this.categories = resp;

			/*=============================================
			Recorrido por el objeto de la data de categorías
			=============================================*/

			let i;

			for (i in resp) {
				/*=============================================
				Separamos los nombres de categorías
				=============================================*/

				this.categoriesList.push(resp[i].name);
			}
		});
		/*=============================================
		Activamos el efecto toggle en el listado de subcategorías
		=============================================*/

		$(document).on('click', '.sub-toggle', function () {
			// $(this).parent().children('ul').toggle();
		});
	}
	/*=============================================
	Función que nos avisa cuando finaliza el renderizado de Angular
	=============================================*/

	callback() {
		if (this.render) {
			this.render = false;
			let arraySubCategories = [];

			/*=============================================
			Separar las categorías
			=============================================*/

			this.categoriesList.forEach((category) => {
				/*=============================================
				Tomamos la colección de las sub-categorías filtrando con los nombres de categoría
				=============================================*/

				this.subCategoriesService.getFilterData('category', category).subscribe((resp: any) => {
					/*=============================================
					Hacemos un recorrido por la colección general de subcategorias y clasificamos las subcategorias y url
					de acuerdo a la categoría que correspondan
					=============================================*/

					let i;

					for (i in resp) {
						arraySubCategories.push({
							category: resp[i].category,
							subcategory: resp[i].name,
							url: resp[i].url
						});
					}

					/*=============================================
					Recorremos el array de objetos nuevo para buscar coincidencias con los nombres de categorías
					=============================================*/

					for (i in arraySubCategories) {
						if (category == arraySubCategories[i].category) {
							$(`[category='${category}']`).append(
								`<li class="current-menu-item ">
		                        	<a href="products/${arraySubCategories[i].url}">${arraySubCategories[i].subcategory}</a>
		                        </li>`
							);
						}
					}
				});
			});
		}
	}
}
