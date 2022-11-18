import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Contest } from "src/app/models/contest";
import { Team } from "src/app/models/team";
import * as moment from "moment/moment";
import { UserService } from "src/app/services/user.service";
import { WishlistService } from "src/app/services/wishlist.service";
import { Post } from "src/app/models/post.model";
import { NgToastService } from "ng-angular-popup";
import { Router } from "@angular/router";
import { LocalStorageService } from "src/app/services/local-storage.service";
import { GetValueLocalService } from "src/app/services/get-value-local.service";

@Component({
  selector: "app-contest-item",
  templateUrl: "./contest-item.component.html",
  styleUrls: ["./contest-item.component.css"],
})
export class ContestItemComponent implements OnInit {
  @Input() item: Contest;
  @Input() isRelate: boolean;
  @Input() major_slug: any;
  @Input() pageContestByUser: boolean;
  @Output() contestRelated = new EventEmitter<boolean>();
  @Output() requestFavorite = new EventEmitter<Contest>();
  @Output() addFavorite = new EventEmitter<number>();

  date_end: number;
  date_start: number;
  date_register_start: number;
  date_register_end: number;
  today: number;
  disabled: boolean = true;
  checkUserHasLogin: boolean = false;
  statusCountDown: boolean = true;

  days: number;
  hours: number;
  minutes: number;
  seconds: number;

  constructor(
    private userSer: UserService,
    private router: Router,
    private toast: NgToastService,
    private wishlist: WishlistService,
    private countSave: LocalStorageService,
    private userService: GetValueLocalService,
  ) {}

  ngOnInit(): void {
    this.userSer.getUserValue().id != undefined ? (this.checkUserHasLogin = true) : this.checkUserHasLogin;

    this.date_start = new Date(moment(this.item.date_start).format("lll")).getTime();
    this.date_end = new Date(moment(this.item.register_deadline).format("lll")).getTime();
    this.date_register_start = new Date(moment(this.item.start_register_time).format("lll")).getTime();
    this.date_register_start > this.today ? (this.disabled = false) : this.disabled;

    setInterval(() => {
      this.date_register_end = new Date(moment(this.item.end_register_time).format("lll")).getTime();
      this.today = new Date().getTime();
      let distance = this.date_register_end - this.today;
      if (distance < 0 || this.item.status == 2 || this.date_register_start > this.today) {
        this.disabled = false;
        this.statusCountDown = false;
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
      } else {
        this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
        this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
      }
    }, 1000);
  }

  runTop() {
    $("html , body").animate(
      {
        scrollTop: 0,
      },
      1000,
    );
  }

  checkDateContest(item: Contest): any {
    let result;
    if (item.status <= 1) {
      if (this.date_register_start > this.today) {
        result = item.date_start;
      } else if (this.date_start > this.today) {
        result = item.date_start;
      } else if (this.date_end > this.today) {
        result = item.register_deadline;
      } else {
        result = item.register_deadline;
      }
    } else {
      result = item.register_deadline;
    }
    return result;
  }

  favoriteEvent(event: any, item: Contest) {
    const data = {
      type: "contest",
      id: item.id,
    };

    if (!this.userService.getValueLocalUser("user")) {
      this.countSave.setIsPopup(1);
    } else {
      this.requestFavorite.emit(item);
      if (event.currentTarget.className.includes("primary-color")) {
        event.currentTarget.classList.remove("primary-color");
        event.currentTarget.parentElement.classList.remove("opacity-100");
        event.currentTarget.parentElement.classList.add("my-add-favorite__icon");
        this.wishlist.wishListRemove(data).subscribe((res) => {
          if (res.status) {
            this.countSave.setCurrentSave(1, false);
          }
        });
      } else {
        event.currentTarget.classList.add("primary-color");
        event.currentTarget.parentElement.classList.add("opacity-100");
        event.currentTarget.parentElement.classList.remove("my-add-favorite__icon");
        this.wishlist.wishListAdd(data).subscribe((res) => {
          if (res.status) {
            this.countSave.setCurrentSave(1, true);
          }
        });
      }
    }
  }

  checkStatusContest(item: Contest, type_display: number): any {
    let result: string;
    let type_time;
    if (item.status <= 1) {
      if (this.date_register_start > this.today) {
        result = "Sắp diễn ra";
        type_time = 1;
      } else if (this.date_register_end > this.today) {
        result = "Đang mở đăng ký";
        type_time = 0;
      } else if (this.date_start > this.today) {
        result = "Đã đóng đăng ký";
        type_time = "Đã đóng đăng ký:";
      } else if (this.date_end > this.today) {
        result = "Đang diễn ra";
        type_time = "Kết thúc: ";
      } else {
        result = "Đã diễn ra";
        type_time = "Kết thúc: ";
      }
    } else {
      result = "Đã kết thúc";
      type_time = "Kết thúc: ";
    }

    return type_display == 1 ? result : type_time;
  }

  isContestRelate(itemID: number) {
    if (this.isRelate) {
      this.router.navigate(["/cuoc-thi/" + itemID]);
      setTimeout(() => {
        this.contestRelated.emit(true);
      }, 50);
    } else {
      this.router.navigate(["/cuoc-thi/" + itemID]);
    }
  }
}
