import { DialogConfirmComponent } from './../../modal/dialog-confirm/dialog-confirm.component';
import { NgToastService } from 'ng-angular-popup';
import { RoundService } from 'src/app/services/round.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Round } from 'src/app/models/round.model';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-capacity-exam',
  templateUrl: './capacity-exam.component.html',
  styleUrls: ['./capacity-exam.component.css']
})
export class CapacityExamComponent implements OnInit {

  @ViewChildren("questions") questions: QueryList<ElementRef>;
  formAnswers!: FormGroup;
  fakeQuestionData!: any;
  // DS id câu hỏi đã trả lời
  questionListId: { questionId: number }[] = [];
  // trạng thái làm bài: 0 -> màn hình chờ làm bài, 1 -> đang làm bài, 2 -> đã nộp
  statusTakingExam: number = 0;
  roundDetail!: Round;
  isFetchingRound = false;
  countDownTimeExam: {minutes: number | string, seconds: number | string} = {
    minutes: "00",
    seconds: "00"
  }
  // thông báo sắp hết giờ
  isNotiExamTimeOut = false;
  // trạng thái đang call api nộp bài
  isSubmitingExam = false;
  timerId!: any;

  constructor(
    private roundService: RoundService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private userService: UserService,
    private toast: NgToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isFetchingRound = true;
    this.route.paramMap.pipe(
      map(params => params.get('round_id')),
      switchMap(id => this.roundService.getRoundWhereId(id))
    ).subscribe(res => {
      if (res.status) {
        this.isFetchingRound = false;
        this.roundDetail = res.payload;
        this.roundDetail.start_time = new Date("2022-06-25 15:25:54")
        console.log(res.payload)
      }
    })
  }

  // làm bài
  handleTakeExam() {
    const confimExamRef = this.dialog.open(DialogConfirmComponent, {
      width: '450px',
      data: {
        title: "Lưu ý",
        description: "Bài làm sẽ được nộp tự động sau khi hết thời gian, không thoát toàn màn hình trong quá trình làm bài!",
        textCancel: "Thoát",
        textOk: "Đồng ý"
      }
    });

    confimExamRef.afterClosed().subscribe(res => {
      if (res === "true") {
        // check user logged
        const userLogged = this.userService.getUserValue();
        if (!userLogged.id) {
          this.toast.warning({ summary: "Vui lòng đăng nhập trước khi làm bài", duration: 3000 });
          this.router.navigate(['/login']);
          return;
        }

        // check thời gian thi
        const todayTime = new Date().getTime();
        const timeStart = new Date(this.roundDetail.start_time).getTime();

        if (todayTime < timeStart) {
          this.toast.warning({ summary: "Chưa đến thời gian làm bài"});
          return;
        }

        // fake api tạo bản nháp
        const res = this.roundService.getInfoCapacityExamRound();
        if (res.status) {
          const data = res.payload;

          // cập nhật trạng thái đang làm bài
          this.statusTakingExam = 1;

          this.fakeQuestionData = data.questions;
          this.createFormControl();

          const durationExam = data.time_type === 1 ? (data.time * 60) : data.time;
          this.handleStartExam(durationExam, data.created_at);
        }
      }
    })
  }

  // nộp bài
  handleSubmitExam() {
    // check làm thiếu câu hỏi
    if (this.formAnswers.valid) {
      const answersData = this.getAnswersData();

      const confirmSubmitExam = this.dialog.open(DialogConfirmComponent, {
        disableClose: true,
        width: "350px",
        data: {
          title: "Xác nhận nộp bài",
          description: "Bạn có chắc chắn muốn nộp bài?",
          textCancel: "Thoát",
          textOk: "Đồng ý"
        }
      });

      confirmSubmitExam.afterClosed().subscribe(result => {
        // xác nhận nộp bài
        if (result === "true") {
          this.openDialogSubmitExam();
          this.submitExam();
        }
      })
      console.log(answersData)
    } else {
      const listQuesNum = this.getFormValidationErrors();

      const confirmSubmitExam = this.dialog.open(DialogConfirmComponent, {
        disableClose: true,
        width: "350px",
        data: {
          title: "Xác nhận nộp bài",
          description: `Bạn chưa hoàn thành các câu: ${listQuesNum.join(", ")}`,
          textCancel: "Tiếp tục",
          textOk: "Nộp bài"
        }
      });

      confirmSubmitExam.afterClosed().subscribe(result => {
        // xác nhận nộp bài
        if (result === "true") {
          this.openDialogSubmitExam();
          this.submitExam();
        }
      })
    }
  }
  // nộp bài
  submitExam() {
    // fake api
    setTimeout(() => {
      this.dialog.closeAll();

      this.statusTakingExam = 2;
      clearInterval(this.timerId);
    }, 3000);
  }

  getAnswersData() {
    const answerFormData = this.formAnswers.value;
  
    // danh sách id câu hỏi và câu trả lời
    const answersData: {questionId: number, answerId: number}[] = [];
    for (const key in answerFormData) {
      const questionId = key.split("-")[2];
      
      answersData.push({
        questionId: +questionId,
        answerId: answerFormData[key]
      })
    }

    return answersData;
  }

  createFormControl() {
    const ctrls: { [name: string ]: FormControl } = {};
    this.fakeQuestionData.forEach((question: any, index: number) => {
      const fieldName = `question-${++index}-${question.id}`;
      ctrls[fieldName] = new FormControl('', Validators.required)
    })

    this.formAnswers = new FormGroup(ctrls);
  }

  // lấy danh sách câu hỏi chưa trả lời
  getFormValidationErrors() {
    const listQuestionNum: number[] = [];
    Object.keys(this.formAnswers.controls).forEach(key => {
      const controlErrors: any = this.formAnswers.get(key)?.errors;

      if (controlErrors != null) {
        const questionNum = key.split("-")[1];
        listQuestionNum.push(+questionNum);
      }
    });

    return listQuestionNum;
  }

  // lưu các câu hỏi đã trả lời
  handleChooseAnswer(questionId: number) {
    const exitsId = this.questionListId.some(item => item.questionId === questionId);
    
    // nếu trong chưa có questionId
    if (!exitsId) {
      this.questionListId.push({
        questionId
      });
    }
  }

  // check câu hỏi đã làm
  checkQuesAnswered(questionId: number) {
    const isAnswerd = this.questionListId.some(item => item.questionId === questionId);

    return isAnswerd;
  }

  // scroll khi click câu hỏi
  scrollToQuestion(indexQuestion: number) {
    this.questions.forEach((questionRef, index) => {
      if (indexQuestion === index) {
        questionRef.nativeElement.scrollIntoView();
      }
    })
  }

  // bắt đầu làm bài
  handleStartExam(duration: number, timeStart: any) {
    // tính thời gian làm bài ban đầu
    const minutesExam = Math.floor(((duration % (60 * 60 * 24)) % (60 * 60)) / 60 );
    const secondsExam = Math.floor(((duration % (60 * 60 * 24)) % (60 * 60)) % 60 );
    this.countDownTimeExam.minutes = minutesExam < 10 ? `0${minutesExam}` : minutesExam;
    this.countDownTimeExam.seconds = secondsExam < 10 ? `0${secondsExam}` : secondsExam;

    let timeStartExam: any = new Date(timeStart).getTime();
    const timeWillEndExam = new Date(timeStartExam + duration * 1000 + 1000);

    this.timerId = setInterval(() => {
      let futureDate = new Date(timeWillEndExam).getTime();
      let today = new Date().getTime();

      let distance = futureDate - today;

      if (distance < 0) {
        this.countDownTimeExam.minutes = "00";
        this.countDownTimeExam.seconds = "00";
        clearInterval(this.timerId);

        // nếu đang không nộp bài => tự động nộp bài
        if (!this.isSubmitingExam) {
          // thông báo nộp bài khi hết thời gian
          this.dialog.closeAll();

          const submitExamRef = this.dialog.open(DialogConfirmComponent, {
            disableClose: true,
            width: "450px",
            data: {
              title: "Hết giờ làm bài",
              description: "Thời gian làm bài của bạn đã hết!. Chúng tôi sẽ nộp kết quả đã lưu vào trước đó của bạn. Ấn nút để nộp bài!",
              isNotShowBtnCancel: true,
              textOk: "Nộp bài"
            }
          });

          submitExamRef.afterClosed().subscribe(result => {
            if (result === "true") {
              this.openDialogSubmitExam();

              this.submitExam();
            }
          })
        }
      } else {
        const minutes: string | number = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        this.countDownTimeExam.minutes = minutes < 10 ? `0${minutes}` : minutes;

        const seconds: number | string = Math.floor((distance % (1000 * 60)) / 1000);
        this.countDownTimeExam.seconds = seconds < 10 ? `0${seconds}` : seconds;

        // thông báo sắp hết giờ
        if (minutes <= 1 && !this.isNotiExamTimeOut) {
          this.toast.warning({ summary: "Sắp hết thời gian làm bài, hãy kiểm tra lại bài làm của bạn", duration: 10000 });
          this.isNotiExamTimeOut = true;
        }
      }

      console.log(this.countDownTimeExam.minutes, this.countDownTimeExam.seconds)
    }, 1000);
  }

  openDialogSubmitExam() {
    this.isSubmitingExam = true;
    this.dialog.open(DialogConfirmComponent, {
      width: '500px',
      disableClose: true,
      data: {
        description: "Vui lòng không thoát ứng dụng. Hệ thống sẽ tự động chuyển đến trang kết quả sau khi nộp bài thành công.",
        isNotShowBtn: true,
        title: "Đang nộp bài...",
        isShowLoading: true
      }
    })
  }
  
  // get vòng tiếp theo
  getNextRound(): { status: boolean, round_id?: number } {
    let nextRound: { status: boolean, round_id?: number };
    const listRound = this.roundDetail.contest.rounds;

    const currentRoundIndex = listRound.findIndex(item => item.id === this.roundDetail.id);
    if (currentRoundIndex < listRound.length - 1) {
      nextRound = {
        status: true,
        round_id: listRound[currentRoundIndex + 1].id
      }
    } else {
      nextRound = {
        status: false
      }
    }

    return nextRound;
  }

  // click vòng thi tiếp theo
  handleGoToNextRound(round_id?: number) {
    this.statusTakingExam = 0;
    this.isSubmitingExam = false;
    this.isFetchingRound = true;
    this.router.navigate(['/test-nang-luc/vao-thi', this.roundDetail.id, 'bai-thi', round_id]);
  }
}
