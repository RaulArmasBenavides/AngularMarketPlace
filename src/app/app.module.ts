import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './modules/footer/footer.component';
import { HeaderComponent } from './modules/header/header.component';
import { HeaderMobileComponent } from './modules/header-mobile/header-mobile.component';
import { HeaderPromotionComponent } from './modules/header-promotion/header-promotion.component';
import { NewletterComponent } from './modules/newletter/newletter.component';

import { ParallaxDirective } from './directives/parallax.directive';
import { StickyHeaderDirective } from './directives/sticky-header.directive';
import { BackgroundImageDirective } from './directives/background-image.directive';
import { TabsDirective } from './directives/tabs.directive';
import { MobileMenuDirective } from './directives/mobile-menu.directive';
import { CustomScrollbarDirective } from './directives/custom-scrollbar.directive';

import { HttpRequestInterceptor } from './core/interceptors/http-request.interceptor';
import { HttpErrorInterceptor } from './core/interceptors/http-error.interceptor';

@NgModule({
	declarations: [
		AppComponent,
		FooterComponent,
		HeaderComponent,
		HeaderMobileComponent,
		HeaderPromotionComponent,
		NewletterComponent
	],
	bootstrap: [AppComponent],
	imports: [
		BrowserModule,
		HttpClientModule,
		AppRoutingModule,
		ParallaxDirective,
		StickyHeaderDirective,
		BackgroundImageDirective,
		TabsDirective,
		MobileMenuDirective,
		CustomScrollbarDirective
	],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HttpRequestInterceptor,
			multi: true
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HttpErrorInterceptor,
			multi: true
		}
	]
})
export class AppModule {}

