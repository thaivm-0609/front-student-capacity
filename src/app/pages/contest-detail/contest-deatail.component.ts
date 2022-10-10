import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Contest } from 'src/app/models/contest';
import { Slider } from 'src/app/models/slider.model';
import { ContestService } from 'src/app/services/contest.service';
import { ModalAddTeamComponent } from 'src/app/modal/modal-add-team/modal-add-team.component';
import { MatDialog } from '@angular/material/dialog';
import { GetValueLocalService } from 'src/app/services/get-value-local.service';
import { Enterprise } from 'src/app/models/enterprise.model';
import { param } from 'jquery';
import { Round } from 'src/app/models/round.model';
import { RoundService } from 'src/app/services/round.service';
import { NgToastService } from 'ng-angular-popup';
import { FormControl } from '@angular/forms';
import { ResultRound } from 'src/app/models/result-round.model';
import { UserService } from 'src/app/services/user.service';
import * as $ from 'jquery';
import { SliderService } from 'src/app/services/slider.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/models/user';
import { TransmitToPost } from 'src/app/models/transmit-to-post.models';
import { ListPostService } from 'src/app/services/list-post.service';
import { Post } from 'src/app/models/post.model';
import { ModalInfoTeamComponent } from 'src/app/modal/modal-info-team/modal-info-team.component';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-contest-deatail',
  templateUrl: './contest-deatail.component.html',
  styleUrls: ['./contest-deatail.component.css'],
})
export class ContestDeatailComponent implements OnInit {
  round_id: number;
  infoUser: User;
  closeResult: string;
  contest_id: any;
  contestRelateTo: Array<Contest> = [];
  resultRank: Array<ResultRound> = [];
  listPost: TransmitToPost = {
    id: 0,
    posts: [],
    numberColumn: 4,
  };
  // ---------------------------
  payLinkArrayResult :  Array<any>;
  payLinkNextResult : string = '';
  payLinkPrevResult :  string = '';

  contestDetail: Contest;
  contestRelated: Array<any>;
  countContestRelated: boolean = false;
  countPostRelated: boolean = false;
  statusRound_id: boolean = false;
  statusRoundDetail: boolean = false;
  statusContestRelated: boolean = false;
  statusContest: boolean = false;
  routeStateRegister: boolean = false;
  statusResultRound: boolean = false;
  statusCheckDate: boolean = true;
  statusUserLogin: boolean = false;
  statusLinks: boolean = false;
  listPostResult: Array<Post> = [];

  sliderSupporter = {
    slidesToShow: 3,
    infinite: true,
    autoplay: true,
    arrows: true,
    prevArrow: '.supporters-arrow-left',
    nextArrow: '.supporters-arrow-right',
    slidesToScroll: 1,
    fadeSpeed: 1000,
  };

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public listPostService: ListPostService,
    private contestService: ContestService,

    private roundService: RoundService,
    private userService: UserService,
    private modalService: NgbModal,
    private title : Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Chi tiết cuộc thi');
  
    // Check user đã đăng nhập hay chưa
    this.userService.getUserValue() ? (this.statusUserLogin = true) : this.statusUserLogin;
    this.runTop();
    this.routeStateRegister = history.state.registerNow;

    this.contest_id = this.route.snapshot.paramMap.get('contest_id');
    this.contestService.getWhereId(this.contest_id).subscribe((res) => {
      if (res.status) {
        this.contestDetail = res.payload;
        this.contestDetail.rounds.length > 0 && this.getResultRank('desc');
        this.contestDetail ? (this.statusContest = true) : this.statusContest;
      }
    });
    

    // Các cuộc thi liên quan
    this.contestService
      .getContestWhereMajor( this.contest_id)
      .subscribe((res) => {
        if (res.status)
          this.contestRelated = res.payload.data.filter((item: Contest) => {
            return item.id !=  this.contest_id;
          });
        if (this.contestRelated) {
          console.log(this.contestRelated);
          
          this.statusContestRelated = true;
          this.contestRelated.length > 0
            ? (this.countContestRelated = true)
            : this.countContestRelated;
        }
      });
  
      this.getListPost();
  }

  //Cac bai post
  getListPost() {
    this.listPostService.getPostWhereCate('post-contest').subscribe((res) => {
      if (res.status) {
        this.listPostResult = res.payload.data.filter(
          (item: Contest, index: number) => {
            return index < 4;
          }
        );
        if(this.listPostResult.length > 0){
          this.countPostRelated == true;
        }
      }
    });
  }

  getUrlPaying(url: string){
    this.statusLinks = false;
    this.roundService.getResultRoundUrl(url).subscribe((res) => {
      if(res.status){
       this.resultRank = res.payload.data;
       this.payLinkArrayResult = res.payload.links;
       this.payLinkNextResult = res.payload.next_page_url;
       this.payLinkPrevResult = res.payload.prev_page_url;
       this.payLinkArrayResult.pop();
       this.payLinkArrayResult.shift();
       this.statusLinks = true;
      }
   });
  }

  sortResult(status: boolean){
    this.statusLinks = false;
    status ? this.getResultRank('asc') : this.getResultRank('desc');
  }

  // Mở model thêm đội thi
  getResultRank(sort : string) {
    this.roundService.getResultRound(this.contestDetail.rounds[this.contestDetail.rounds.length - 1].id ,  sort).subscribe((res) => {
       if(res.status){
        this.resultRank = res.payload.data;
        this.payLinkArrayResult = res.payload.links;
        this.payLinkNextResult = res.payload.next_page_url;
        this.payLinkPrevResult = res.payload.prev_page_url;
        this.payLinkArrayResult.pop();
        this.payLinkArrayResult.shift();
        this.statusLinks = true;
       }
    });
  }


  scrollWin(elementString: any, distanceApart: number) {
    let element = document.querySelector(elementString);
    let numberScroll = element.offsetTop;
    window.scrollTo({ top: numberScroll - distanceApart, behavior: 'smooth' });
  }

  runTop() {
    $('html , body').animate(
      {
        scrollTop: 0,
      },
      1000
    );
  }

  // Mở nộ dung vòng thi
  open(content: any) {
    this.modalService.open(content, { scrollable: true });
  }
}
