import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { ConfigViewService } from 'src/app/services/config-view.service';
import { GetValueLocalService } from 'src/app/services/get-value-local.service';
import * as $ from 'jquery';
import { WishlistService } from 'src/app/services/wishlist.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-home-layout',
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.css'],
})
export class HomeLayoutComponent implements OnInit {
  user: User;
  statusWindow: boolean = false;
  statusLogin: boolean = false;
  countContest: number;
  countPost: number;
  constructor(
    private wishlist: WishlistService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.backTop();
    this.winBackTop();
    if(this.userService.getUserValue().id){
      this.getListCount();
    }

    window.addEventListener('scroll', () => {
      this.winBackTop();
      this.headerBlockScroll();
    });
  }

  winBackTop() {
    let windowScroll = window.scrollY;
    if (windowScroll > 0) {
      this.statusWindow = true;
    } else {
      this.statusWindow = false;
    }
  }

  getListCount(){
    this.wishlist.wishListCount().subscribe((res) => {      
      if(res.status){
        this.countContest = res.payload.count_post;
        this.countPost = res.payload.count_contest;
      }
    })
  }

  headerBlockScroll() {
    let header = document.querySelector('.header');
    if (window.scrollY > 400) {
      header?.classList.add('fixed');
      document.querySelector('.overlay')?.classList.add('d-none');
      document.querySelector('.sidepanel')?.classList.remove('save-info-acive');
    } else{
      header?.classList.remove('fixed');
    }
  }

  // Change screen back top
  backTop() {
    $('html , body').animate(
      {
        scrollTop: 0,
      },
      1000
    );
  }
}
