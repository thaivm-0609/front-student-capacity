import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Contest } from 'src/app/models/contest';
import { Enterprise } from 'src/app/models/enterprise.model';
import { Recruitments } from 'src/app/models/recruitments.models';
import { RecruitmentsService } from 'src/app/services/recruitments.service';

@Component({
  selector: 'app-recruitment',
  templateUrl: './recruitment.component.html',
  styleUrls: ['./recruitment.component.css']
})
export class RecruitmentComponent implements OnInit {
  panelOpenState = false;
  rescruitment_id: number;
  rescruitmentDetail: Recruitments;
  rescruitmentComanySupport: Array<Enterprise>;
  rescruitmentCapacity: Array<Contest>;

  companyLength: number;

  constructor(
    public recruitment: RecruitmentsService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecruitmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rescruitment_id: number },) {
    this.rescruitment_id = data.rescruitment_id;
  }

  ngOnInit(): void {
    this.getRecruitDetail(this.rescruitment_id);
  }

  closeDialog() {
    this.dialogRef.close('Pizza!');
  }

  // Danh sách các daonh nghiệp tham gia đợt tuyển dụng.
  getRecruitDetail(recruitment_id: number) {
    this.recruitment.getRecruitmentDetail(recruitment_id).subscribe(res => {
      if (res.status) {
        this.rescruitmentDetail = res.payload;
        this.rescruitmentComanySupport = this.rescruitmentDetail.enterprise;
        this.rescruitmentCapacity = this.rescruitmentDetail.contest;
        this.companyLength = this.rescruitmentComanySupport.length;
        console.log(this.rescruitmentCapacity);
      }
    })
  }
}
