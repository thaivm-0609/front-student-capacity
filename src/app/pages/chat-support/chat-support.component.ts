import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { ChatSupportService } from "src/app/services/chat-support.service";
import { LocalStorageService } from "src/app/services/local-storage.service";
import { UserService } from "src/app/services/user.service";
@Component({
  selector: "app-chat-support",
  templateUrl: "./chat-support.component.html",
  styleUrls: ["./chat-support.component.css"],
})
export class ChatSupportComponent implements OnInit, AfterViewChecked {
  @ViewChild("formControlSendMsg") formControlSendMsg: ElementRef<HTMLInputElement>;
  @ViewChild("chatContent") chatContent: ElementRef<HTMLInputElement>;

  users: any = [];
  data_chat: any = [];
  authId = 0;
  authFr = 0;
  dataChatValue = "";
  roomCode = "";
  chatActive: any = [];
  isSendingChat = false;
  isLogged = false;
  isEnableAutoScroll = false;
  isTabHidden = false;
  isHasNewMessage = false;
  defaultTitle = "Hỗ trợ trực tuyến";
  timerId: any;

  constructor(
    private titleService: Title,
    private userService: UserService,
    private chatSPService: ChatSupportService,
    private router: Router,
    private localStorageService: LocalStorageService,
  ) {}

  ngAfterViewChecked(): void {
    if (this.chatContent && this.isEnableAutoScroll) {
      this.chatContent.nativeElement.scrollTop = this.chatContent.nativeElement.scrollHeight;
      this.isEnableAutoScroll = false;
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.defaultTitle);
    const user = this.userService.getUserValue();
    const jwtToken = this.userService.getJwtToken();
    this.isLogged = !!(user && jwtToken);

    if (this.isLogged) {
      this.authId = user.id;
      this.chanel();
      this.handleChangeTabWindow();
    }
  }

  sendDataChat() {
    if (this.isSendingChat) return;

    this.isSendingChat = true;
    this.chatSPService
      .sendDataChat({
        room: this.roomCode,
        message: this.dataChatValue,
      })
      .subscribe(
        () => {
          this.dataChatValue = "";
          this.isSendingChat = false;
        },
        () => {
          this.dataChatValue = "";
          this.isSendingChat = false;
        },
        () => {
          setTimeout(() => {
            this.formControlSendMsg.nativeElement.focus();
          }, 0);
        },
      );
  }

  showChat(authFr: any) {
    this.roomCode = this.authId + "-" + authFr;
    this.renderUser();
  }
  renderUser() {
    var that = this;
    this.chatActive = this.data_chat.filter(function (data: any) {
      return data.id == that.roomCode;
    });
  }
  checkUserGetKey(id: any) {
    var key = null;
    this.data_chat.filter(function (data: any, k: any) {
      if (data.id == id) key = k;
    });
    return key;
  }
  privateChannel(code: any = null) {
    var that = this;
    (window as any).Echo.private(`support.poly.${code ?? this.roomCode}`).listen("ChatSupportEvent", (e: any) => {
      var k: any = that.checkUserGetKey(e.data.room);
      that.data_chat[k].data.push(e.data);
      this.isEnableAutoScroll = true;

      // check has new message
      const isHasNewMessage = this.authId !== e.data.id;
      isHasNewMessage && this.isTabHidden && this.handleToggleTitle();

      var dataFist = that.data_chat[0];
      that.data_chat[0] = that.data_chat[k];
      that.data_chat[k] = dataFist;
    });
  }
  chanel() {
    var that = this;
    (window as any).Echo.join("support.poly")
      .here((users: any) => {
        that.users = users;

        that.users.map(function (user: any) {
          const checkHasExits = that.data_chat.filter(function (data: any) {
            return data.user.id == user.id;
          });
          if (checkHasExits.length == 0 && user.ctv_st_p == true) {
            that.privateChannel(that.authId + "-" + user.id);
            that.data_chat.push({
              id: that.authId + "-" + user.id,
              data: [],
              user: user,
            });
          }
        });
        $("#kt_aside_toggle").click();
      })
      .joining((user: any) => {
        that.users.push(user);
        const checkHasExits = that.data_chat.filter(function (data: any) {
          return data.user.id == user.id;
        });
        if (checkHasExits.length == 0 && user.ctv_st_p == true) {
          that.privateChannel(that.authId + "-" + user.id);
          that.data_chat.push({
            id: that.authId + "-" + user.id,
            data: [],
            user: user,
          });
        }
      })
      .leaving((user: any) => {
        var us = that.users.filter(function (data: any) {
          return data.id !== user.id;
        });

        if (user.ctv_st_p == true) {
          that.data_chat = that.data_chat.filter(function (data: any) {
            return data.user.id != user.id;
          });
        }
        that.chatActive = [];
        (window as any).Echo.leave(`private-support.poly.${that.authId + "-" + user.id}`);
        that.users = us;
      });
  }

  // save current route name
  handleGoToLoginPage() {
    this.localStorageService.saveCurrentRoute();
    this.router.navigate(["/login"]);
  }

  // xử lý sự kiện đổi tab
  handleChangeTabWindow() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.isTabHidden = true;
      } else {
        this.isTabHidden = false;
        this.titleService.setTitle(this.defaultTitle);
        clearInterval(this.timerId);
      }
    });
  }

  handleToggleTitle() {
    this.timerId = setInterval(() => {
      const currentTitle = this.titleService.getTitle();
      this.titleService.setTitle(currentTitle === this.defaultTitle ? "1 tin nhắn mới" : this.defaultTitle);
    }, 1000);
  }

  ngOnDestroy(): void {
    (window as any).Echo.leave(this.roomCode);
    (window as any).Echo.leave("support.poly");
    document.addEventListener("visibilitychange", () => {});
    clearInterval(this.timerId);
  }
}
