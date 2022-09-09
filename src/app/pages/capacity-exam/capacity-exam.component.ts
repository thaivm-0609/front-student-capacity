import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DialogConfirmComponent } from "./../../modal/dialog-confirm/dialog-confirm.component";
import { RoundService } from "src/app/services/round.service";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { Component, ElementRef, Inject, OnInit, QueryList, TemplateRef, ViewChildren } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { map, switchMap } from "rxjs";
import { Round } from "src/app/models/round.model";
import { MatDialog } from "@angular/material/dialog";
import { UserService } from "src/app/services/user.service";
import { DOCUMENT } from "@angular/common";
import { User } from "src/app/models/user";
import { ExamCapacity } from "src/app/models/exam.model";
import { NgToastService } from "ng-angular-popup";
import * as moment from "moment";

@Component({
  selector: "app-capacity-exam",
  templateUrl: "./capacity-exam.component.html",
  styleUrls: ["./capacity-exam.component.css"],
})
export class CapacityExamComponent implements OnInit {
  @ViewChildren("questions") questions: QueryList<ElementRef>;
  userLogged!: User;
  formAnswers!: FormGroup;
  examData!: ExamCapacity;
  // trạng thái làm bài: 0 -> màn hình chờ làm bài, 1 -> đang làm bài, 2 -> đã nộp
  statusTakingExam: number = 0;
  roundDetail!: Round;
  isFetchingRound = false;
  isFetchingSttExam = false;
  isFetchingExam = false;
  isFullScreen = false;
  // đang làm bài ? button tiếp tục : button bắt đầu
  isContinueExam = false;
  countDownTimeExam: { minutes: number | string; seconds: number | string } = {
    minutes: "00",
    seconds: "00",
  };
  // thông báo sắp hết giờ
  isNotiExamTimeOut = false;
  // trạng thái đang call api nộp bài
  isSubmitingExam = false;
  // trạng thái hết giờ làm bài
  isTimeOut = false;
  timerId!: any;
  element!: any;

  // kết quả bài test
  resultExam!: {
    score: string; // điểm
    examTime: string; // thời gian làm bài,
    submitAt: string; // thời gian nộp bài,
    donotAnswer: number; // tổng số câu chưa làm,
    falseAnswer: number; // tổng số câu làm sai,
    trueAnswer: number; // tổng số câu làm đúng
  };

  // kích thước màn hình
  windowScreenSize!: { width: number; height: number };

  constructor(
    private roundService: RoundService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private userService: UserService,
    private toast: NgToastService,
    private router: Router,
    private modalService: NgbModal,
    @Inject(DOCUMENT) private document: any,
  ) {}

  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // chặn f11
    window.addEventListener("keydown", (e: any) => {
      if (e.keyCode === 122) this.disabledEvent(e);
    });

    this.element = this.document.documentElement;

    this.isFetchingRound = true;
    this.route.paramMap
      .pipe(
        map((params) => params.get("round_id")),
        switchMap((id) => this.roundService.getRoundWhereId(id)),
      )
      .subscribe((responseRound) => {
        if (responseRound.status) {
          this.isFetchingRound = false;
          this.isFetchingSttExam = true;
          this.roundDetail = responseRound.payload;

          // check login
          this.userLogged = this.userService.getUserValue();
          // nếu đã login ? check trạng thái làm bài : hiển thị màn hình chờ làm bài
          if (this.userLogged.id) {
            this.roundService
              .getInfoCapacityExamRound({
                round_id: responseRound.payload.id,
              })
              .subscribe(
                ({ status, payload, result }) => {
                  // nếu đang làm ? tiếp tục làm bài
                  this.isFetchingSttExam = false;
                  if (!status) return;
                  if (payload === 0) {
                    this.isContinueExam = true;
                  } else if (payload === 1) {
                    // đã nộp bài
                    this.statusTakingExam = 2;
                    const { minutes, seconds } = this.getMinutesAndSecondBetweenTwoDate(
                      result.created_at,
                      result.updated_at,
                    );
                    this.resultExam = {
                      score: Number.isInteger(result.scores) ? result.scores.toString() : result.scores.toFixed(1),
                      examTime: !+minutes ? `${seconds} giây` : `${minutes} phút ${seconds} giây`,
                      submitAt:
                        +moment(result.updated_at).format("YYYY") !== +new Date().getFullYear()
                          ? moment(result.updated_at).format("DD [tháng] MM, YYYY [lúc] HH:mm")
                          : moment(result.updated_at).format("DD [tháng] MM [lúc] HH:mm"),
                      donotAnswer: result.donot_answer,
                      falseAnswer: result.false_answer,
                      trueAnswer: result.true_answer,
                    };
                  }
                },
                (error) => {
                  this.isFetchingSttExam = false;
                },
              );
          } else {
            this.isFetchingSttExam = false;
          }
        }
      });
  }

  // làm bài
  handleTakeExam() {
    const confimExamRef = this.dialog.open(DialogConfirmComponent, {
      width: "450px",
      data: {
        title: "Lưu ý",
        description:
          "Bài làm sẽ được nộp tự động sau khi hết thời gian, không thoát toàn màn hình trong quá trình làm bài!",
        textCancel: "Thoát",
        textOk: "Đồng ý",
      },
    });

    confimExamRef.afterClosed().subscribe((res) => {
      if (res === "true") {
        // check user logged
        const userLogged = this.userService.getUserValue();
        if (!userLogged.id) {
          this.toast.warning({ summary: "Vui lòng đăng nhập trước khi làm bài", duration: 3000 });
          this.router.navigate(["/login"]);
          return;
        }

        // check thời gian thi
        const todayTime = new Date().getTime();
        const timeStart = new Date(this.roundDetail.start_time).getTime();
        const timeEnd = new Date(this.roundDetail.end_time).getTime();

        if (todayTime < timeStart) {
          this.toast.warning({ summary: "Chưa đến thời gian làm bài" });
          return;
        }
        if (todayTime >= timeEnd) {
          this.toast.warning({ summary: "Phần thi đã kết thúc" });
          return;
        }

        // check trạng thái pass vòng thi trước
        const preRoundExits = this.getPreRound();
        if (preRoundExits.status) {
          this.isFetchingRound = true;
          const preRoundId = preRoundExits.round_id;

          this.roundService.getInfoCapacityExamRound({ round_id: preRoundId }).subscribe(
            (response) => {
              if (!response.status) return;
              this.isFetchingRound = false;

              if (response.payload === 0) {
                this.toast.info({ summary: "Vui lòng hoàn thành phần thi trước đó" });
                return;
              }

              this.openFullscreen();
              this.takeExam();
            },
            () => {
              this.isFetchingRound = false;
              this.toast.info({ summary: "Bạn chưa làm phần thi trước đó!" });
            },
          );
          return;
        }

        this.openFullscreen();
        this.takeExam();
      }
    });
  }

  handleContinueTakeExam() {
    const confimExamRef = this.dialog.open(DialogConfirmComponent, {
      width: "450px",
      data: {
        title: "Lưu ý",
        description:
          "Bài làm sẽ được nộp tự động sau khi hết thời gian, không thoát toàn màn hình trong quá trình làm bài!",
        textCancel: "Thoát",
        textOk: "Đồng ý",
      },
    });

    confimExamRef.afterClosed().subscribe((res) => {
      if (res === "true") {
        this.openFullscreen();
        this.takeExam();
      }
    });
  }

  takeExam() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    this.isFetchingExam = true;

    setTimeout(() => {
      // kích thước khi full màn hình
      this.windowScreenSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // bắt sự kiện thay đổi kích thước màn hình (f11)
      window.onresize = (e: any) => {
        if (this.isTimeOut || this.isSubmitingExam) return;

        const currentWindowWidth = e.target.innerWidth;
        const currentWindowHeight = e.target.innerHeight;

        const { width, height } = this.windowScreenSize;

        if (currentWindowWidth !== width || currentWindowHeight !== height) {
          this.dialog.closeAll();

          const dialogFullscreen = this.dialog.open(DialogConfirmComponent, {
            width: "300px",
            disableClose: true,
            data: {
              isNotShowBtnCancel: true,
              title: "Cảnh báo",
              description: "Vui lòng bật full màn hình khi làm bài!",
            },
          });

          dialogFullscreen.afterClosed().subscribe((result) => {
            result === "true" && this.openFullscreen();
          });
        } else {
          this.dialog.closeAll();
        }
      };

      // chặn f12
      window.onkeydown = (e: any) => this.handleDisableKeydown(e);

      // chặn chuột phải
      window.oncontextmenu = (e: any) => this.disabledEvent(e);

      this.roundService.takeExam({ round_id: this.roundDetail.id }).subscribe((res) => {
        if (res.status) {
          this.examData = {
            ...res.payload,
            exam_at: res.exam_at,
            time_exam: this.convertTimeExamToSeconds(res.payload.time, res.payload.time_type) / 60,
          };

          this.isFetchingExam = false;
          // cập nhật trạng thái đang làm bài
          this.statusTakingExam = 1;

          this.createFormControl();

          const durationExam = this.convertTimeExamToSeconds(this.examData.time, this.examData.time_type);
          this.handleStartExam(durationExam, this.examData.exam_at);
        }
      });
    }, 100);
  }

  // nộp bài
  handleSubmitExam() {
    // check làm thiếu câu hỏi
    if (this.formAnswers.valid) {
      const confirmSubmitExam = this.dialog.open(DialogConfirmComponent, {
        disableClose: true,
        width: "350px",
        data: {
          title: "Xác nhận nộp bài",
          description: "Bạn có chắc chắn muốn nộp bài?",
          textCancel: "Thoát",
          textOk: "Đồng ý",
        },
      });

      confirmSubmitExam.afterClosed().subscribe((result) => {
        // xác nhận nộp bài
        if (result === "true") {
          this.openDialogSubmitExam();
          this.submitExam();
        }
      });
    } else {
      const listQuesNum = this.getFormValidationErrors();

      const confirmSubmitExam = this.dialog.open(DialogConfirmComponent, {
        disableClose: true,
        width: "350px",
        data: {
          title: "Xác nhận nộp bài",
          description: `Bạn chưa hoàn thành các câu: ${listQuesNum.join(", ")}`,
          textCancel: "Tiếp tục",
          textOk: "Nộp bài",
        },
      });

      confirmSubmitExam.afterClosed().subscribe((result) => {
        // xác nhận nộp bài
        if (result === "true") {
          this.openDialogSubmitExam();
          this.submitExam();
        }
      });
    }
  }
  // nộp bài
  submitExam() {
    const answersData = this.getAnswersData();

    this.roundService
      .capacitySubmitExam({
        exam_id: this.examData.id,
        data: answersData,
      })
      .subscribe(({ status, payload }) => {
        if (status) {
          // kết quả bài làm
          const { minutes, seconds } = this.getMinutesAndSecondBetweenTwoDate(payload.created_at, payload.updated_at);
          this.resultExam = {
            score: Number.isInteger(payload.scores) ? payload.scores.toString() : payload.scores.toFixed(1),
            examTime: !+minutes ? `${seconds} giây` : `${minutes} phút ${seconds} giây`,
            submitAt: moment(payload.updated_at).format("DD [tháng] MM [lúc] HH:mm"),
            donotAnswer: payload.donot_answer,
            falseAnswer: payload.false_answer,
            trueAnswer: payload.true_answer,
          };

          this.dialog.closeAll();
          // reset variable
          this.statusTakingExam = 2;
          clearInterval(this.timerId);
          this.isFetchingRound = false;
          this.isFetchingSttExam = false;
          this.isFetchingExam = false;
          this.isFullScreen = false;
          this.isContinueExam = false;
          this.isNotiExamTimeOut = false;
          this.isSubmitingExam = false;
          this.isTimeOut = false;

          // remove event listener
          window.onresize = () => {};
          window.onkeydown = () => {};
          window.oncontextmenu = () => {};
          window.addEventListener("keydown", () => {});

          localStorage.removeItem("test_result");

          // thoát toàn màn hình
          this.closeFullscreen();
        }
      });
  }

  getAnswersData() {
    const answerFormData = this.formAnswers.value;

    // danh sách id câu hỏi và câu trả lời
    const answersData: {
      questionId: number;
      answerId?: number;
      answerIds?: [];
      answer?: string;
      type: number; // 0: câu hỏi 1 đáp án, 1: câu hỏi nhiều đáp án, 2: code onl
    }[] = [];
    for (const key in answerFormData) {
      const questionId = key.split("-")[2];
      const questionType = +key.split("-")[3];

      if (questionType === 0) {
        answersData.push({
          questionId: +questionId,
          answerId: answerFormData[key],
          type: questionType,
        });
      } else if (questionType === 1) {
        answersData.push({
          questionId: +questionId,
          answerIds: answerFormData[key],
          type: questionType,
        });
      } else if (questionType === 2) {
        answersData.push({
          questionId: +questionId,
          answer: answerFormData[key],
          type: questionType,
        });
      }
    }

    return answersData;
  }

  createFormControl() {
    const ctrls: { [name: string]: FormControl | FormArray } = {};
    this.examData.questions.forEach((question, index: number) => {
      const fieldName = `question-${++index}-${question.id}-${question.type}`; // question-stt câu hỏi-id câu hỏi-loại câu hỏi

      // câu hỏi 1 đáp án
      if (question.type === 0) {
        ctrls[fieldName] = new FormControl("", Validators.required);
      } else if (question.type === 1) {
        ctrls[fieldName] = new FormArray([], Validators.required);
      }
    });

    this.formAnswers = new FormGroup(ctrls);

    // check câu trả lời trong localStorage
    const testResult = JSON.parse(localStorage.getItem("test_result") as string);
    if (testResult && testResult.data) {
      for (const item in testResult.data) {
        const questionType = +item.split("-")[3];

        // câu hỏi 1 đáp án
        if (questionType === 0) {
          this.formAnswers.patchValue({
            [item]: testResult.data[item],
          });
        } else if (questionType === 1) {
          // câu hỏi nhiều đáp án
          const formArray: FormArray = this.formAnswers.get(item) as FormArray;

          testResult.data[item].forEach((answerId: string) => {
            formArray.push(new FormControl(answerId));
          });
        }
      }
    }
  }

  // lấy danh sách câu hỏi chưa trả lời
  getFormValidationErrors() {
    const listQuestionNum: number[] = [];
    Object.keys(this.formAnswers.controls).forEach((key) => {
      const controlErrors: any = this.formAnswers.get(key)?.errors;

      if (controlErrors != null) {
        const questionNum = key.split("-")[1];
        listQuestionNum.push(+questionNum);
      }
    });

    return listQuestionNum;
  }

  // lưu các câu hỏi đã trả lời
  handleAutoSaveAnswer(formControlName: string) {
    const tempValue = { ...this.formAnswers.value };

    this.formAnswers.get(formControlName)?.valueChanges.subscribe((value) => {
      tempValue[formControlName] = value;
      localStorage.setItem(
        "test_result",
        JSON.stringify({
          exam_id: this.examData.id,
          data: tempValue,
        }),
      );
    });
  }

  // check câu hỏi đã làm
  checkQuesAnswered(controlName: string) {
    let isAnswerd = false;
    const formValues = this.formAnswers.value;

    for (const item in formValues) {
      if (item === controlName) {
        if (Array.isArray(formValues[item]) && formValues[item].length >= 1) {
          isAnswerd = true;
        }

        if (!Array.isArray(formValues[item]) && formValues[item]) {
          isAnswerd = true;
        }
      }
    }

    return isAnswerd;
  }

  // scroll khi click câu hỏi
  scrollToQuestion(indexQuestion: number) {
    this.questions.forEach((questionRef, index) => {
      if (indexQuestion === index) {
        questionRef.nativeElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // bắt đầu làm bài
  handleStartExam(duration: number, timeStart: any) {
    // tính thời gian làm bài ban đầu
    const { minutes: minutesExam, seconds: secondsExam } = this.convertMsToMinutesAndSecond(duration * 1000);
    this.countDownTimeExam.minutes = minutesExam;
    this.countDownTimeExam.seconds = secondsExam;

    let timeStartExam: any = new Date(timeStart).getTime();
    const timeWillEndExam = new Date(timeStartExam + duration * 1000 + 1000);

    this.timerId = setInterval(() => {
      let futureDate = new Date(timeWillEndExam).getTime();
      let today = new Date().getTime();
      let timeEndRound = new Date(this.roundDetail.end_time).getTime();

      let distance = futureDate - today;

      // hết giờ hoặc vòng thi đóng
      if (distance < 0 || today > timeEndRound) {
        this.countDownTimeExam.minutes = "00";
        this.countDownTimeExam.seconds = "00";
        clearInterval(this.timerId);
        this.isTimeOut = true;

        // nếu đang không nộp bài => tự động nộp bài
        if (!this.isSubmitingExam) {
          // thông báo nộp bài khi hết thời gian
          this.dialog.closeAll();

          const submitExamRef = this.dialog.open(DialogConfirmComponent, {
            disableClose: true,
            width: "450px",
            data: {
              title: "Hết giờ làm bài",
              description:
                "Thời gian làm bài của bạn đã hết!. Chúng tôi sẽ nộp kết quả đã lưu vào trước đó của bạn. Ấn nút để nộp bài!",
              isNotShowBtnCancel: true,
              textOk: "Nộp bài",
            },
          });

          submitExamRef.afterClosed().subscribe((result) => {
            if (result === "true") {
              this.openDialogSubmitExam();
              this.submitExam();
            }
          });
        }
      } else {
        const { minutes, seconds } = this.convertMsToMinutesAndSecond(distance);
        this.countDownTimeExam.minutes = minutes;
        this.countDownTimeExam.seconds = seconds;

        // thông báo sắp hết giờ
        if (minutes <= 1 && !this.isNotiExamTimeOut) {
          this.toast.warning({
            summary: "Sắp hết thời gian làm bài, hãy kiểm tra lại bài làm của bạn",
            duration: 10000,
          });
          this.isNotiExamTimeOut = true;
        }
      }
    }, 1000);
  }

  // convert milisecond to minus
  convertMsToMinutesAndSecond(milisecond: number) {
    let minutes: string | number = Math.floor(milisecond / 60000);
    let seconds: string | number = +((milisecond % 60000) / 1000).toFixed(0);
    if (seconds === 60) {
      seconds = 0;
      minutes += 1;
    }

    if (minutes < 10) minutes = `0${minutes}`;
    if (seconds < 10) seconds = `0${seconds}`;

    return { minutes, seconds };
  }

  openDialogSubmitExam() {
    this.isSubmitingExam = true;
    this.dialog.open(DialogConfirmComponent, {
      width: "500px",
      disableClose: true,
      data: {
        description:
          "Vui lòng không thoát ứng dụng. Hệ thống sẽ tự động chuyển đến trang kết quả sau khi nộp bài thành công.",
        isNotShowBtn: true,
        title: "Đang nộp bài...",
        isShowLoading: true,
      },
    });
  }

  // get vòng thi trước
  getPreRound() {
    let preRound: { status: boolean; round_id?: number };
    const listRound = this.roundDetail.contest.rounds;

    const currentRoundIndex = listRound.findIndex((item) => item.id === this.roundDetail.id);
    if (currentRoundIndex > 0 && listRound.length >= 2) {
      preRound = {
        status: true,
        round_id: listRound[currentRoundIndex - 1].id,
      };
    } else {
      preRound = {
        status: false,
      };
    }

    return preRound;
  }

  // get vòng tiếp theo
  getNextRound(): { status: boolean; round_id?: number } {
    let nextRound: { status: boolean; round_id?: number };
    const listRound = this.roundDetail.contest.rounds;

    const currentRoundIndex = listRound.findIndex((item) => item.id === this.roundDetail.id);
    if (currentRoundIndex < listRound.length - 1) {
      nextRound = {
        status: true,
        round_id: listRound[currentRoundIndex + 1].id,
      };
    } else {
      nextRound = {
        status: false,
      };
    }

    return nextRound;
  }

  // click vòng thi tiếp theo
  handleGoToNextRound(round_id?: number) {
    this.statusTakingExam = 0;
    this.isSubmitingExam = false;
    this.isFetchingRound = true;
    this.router.navigate(["/test-nang-luc/vao-thi", this.roundDetail.contest.id, "bai-thi", round_id]);
  }

  // open full screen
  openFullscreen() {
    if (this.element.requestFullscreen) {
      this.element.requestFullscreen();
    } else if (this.element.mozRequestFullScreen) {
      /* Firefox */
      this.element.mozRequestFullScreen();
    } else if (this.element.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      this.element.webkitRequestFullscreen();
    } else if (this.element.msRequestFullscreen) {
      /* IE/Edge */
      this.element.msRequestFullscreen();
    }

    this.isFullScreen = true;
  }

  /* Close fullscreen */
  closeFullscreen() {
    if (this.document.exitFullscreen) {
      this.document.exitFullscreen();
    } else if (this.document.mozCancelFullScreen) {
      /* Firefox */
      this.document.mozCancelFullScreen();
    } else if (this.document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      this.document.webkitExitFullscreen();
    } else if (this.document.msExitFullscreen) {
      /* IE/Edge */
      this.document.msExitFullscreen();
    }

    this.isFullScreen = false;
  }

  // disable event
  disabledEvent(e: Event) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else if (window.event) {
      window.event.cancelBubble = true;
    }
    e.preventDefault();
    return false;
  }

  // chặn f12
  handleDisableKeydown(e: any) {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
      this.disabledEvent(e);
    }
    // "J" key
    if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
      this.disabledEvent(e);
    }
    // "S" key + macOS
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
      this.disabledEvent(e);
    }
    // "U" key
    if (e.ctrlKey && e.keyCode == 85) {
      this.disabledEvent(e);
    }
    // "F12" key
    if (e.keyCode == 123) {
      this.disabledEvent(e);
    }
    if (e.ctrlKey && (e.key == "p" || e.charCode == 16 || e.charCode == 112 || e.keyCode == 80)) {
      e.cancelBubble = true;
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    if (e.ctrlKey && e.keyCode === 67) {
      this.disabledEvent(e);
      navigator.clipboard.writeText("Thí sinh không được gian lận trong quá trình làm bài!");
    }
  }

  // get thời gian làm bài
  convertTimeExamToSeconds(time: number, time_type: number) {
    // time_type: 0 => phút, 1 => giờ, 2 => ngày
    let timeExam = 0;

    switch (time_type) {
      case 0:
        timeExam = time * 60;
        break;
      case 1:
        timeExam = time * 60 * 60;
        break;
      case 2:
        timeExam = time * 24 * 60 * 60;
        break;
    }

    return timeExam;
  }

  // xử lý đối với câu hỏi có nhiều đáp án
  onCheckChange(formControlName: string, event: any) {
    const formArray: FormArray = this.formAnswers.get(formControlName) as FormArray;

    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(new FormControl(event.target.value));
    } else {
      /* unselected */
      // find the unselected element
      let i: number = 0;

      formArray.controls.forEach((ctrl) => {
        if (ctrl.value == event.target.value) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }

        i++;
      });
    }
  }

  // check đáp án của câu hỏi có nhiều đáp án
  checkAnswerd(formControlNam: string, answerId: number) {
    let isChecked = false;
    const testResult = JSON.parse(localStorage.getItem("test_result") as string);

    if (testResult && testResult.data) {
      for (const item in testResult.data) {
        if (item === formControlNam) {
          isChecked = testResult.data[item].includes(answerId.toString()) ? true : false;
        }
      }
    }

    return isChecked;
  }

  // open modal lịch sử bài làm
  handleOpenHistoryExam(content: TemplateRef<any>) {
    this.modalService.open(content, { size: "lg", scrollable: true });
  }

  // tính thời gian làm bài
  getMinutesAndSecondBetweenTwoDate(firstDate: Date, lastDate: Date) {
    const firstDateMs = new Date(firstDate).getTime();
    const lastDateMs = new Date(lastDate).getTime();
    const diffMs = lastDateMs - firstDateMs;

    return this.convertMsToMinutesAndSecond(diffMs);
  }
}
