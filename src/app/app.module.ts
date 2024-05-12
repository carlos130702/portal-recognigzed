import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {InputTextModule} from "primeng/inputtext";
import {firebaseProviders} from "./firebase.config";
import initializeApp = firebase.initializeApp;
import {environment} from "../environments/environment";
import {provideFirebaseApp} from "@angular/fire/app";
import {AngularFireModule} from "@angular/fire/compat";
import {getAuth, provideAuth} from "@angular/fire/auth";
import {AngularFireAuthModule} from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import { UpperCamelCasePipe } from './pipes/upper-camel-case.pipe';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UpperCamelCasePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    ToastModule
  ],
  providers: [
    firebaseProviders,
    MessageService
  ],
  exports: [
    UpperCamelCasePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
