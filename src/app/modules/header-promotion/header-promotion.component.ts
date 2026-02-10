import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProductsService } from '../../services/products.service';

@Component({
    selector: 'app-header-promotion',
    templateUrl: './header-promotion.component.html',
    styleUrls: ['./header-promotion.component.css'],
    standalone: false
})
export class HeaderPromotionComponent implements OnInit {

  path: string = environment.assets;
  top_banner:Object = new Object;
  preload:boolean = false;

  constructor(private readonly productsService: ProductsService ) { }

  ngOnInit(): void {

    this.preload = true;

		this.productsService.getData()
		.subscribe((resp:any) =>{

			// console.log("resp", resp[Object.keys(resp)[1]]);

			/*=============================================
			Tomar la longitud del objeto
			=============================================*/

			let i;
			let size = 0;

			for(i in resp){

				size++

			}

			/*=============================================
			Generar un número aleatorio
			=============================================*/

			let index = Math.floor(Math.random()*size);

			/*=============================================
			Devolvemos a la vista un banner aleatorio
			=============================================*/

			this.top_banner = JSON.parse(resp[Object.keys(resp)[index]].top_banner);

			this.preload = false;


		})
  }

}
