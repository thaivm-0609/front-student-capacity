import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CompanyService } from 'src/app/services/company.service';
import { Enterprise } from 'src/app/models/enterprise.model';
import { RecruitmentsService } from 'src/app/services/recruitments.service';
import { Recruitments } from 'src/app/models/recruitments.models';
import { Slider } from 'src/app/models/slider.model';
import { Contest } from 'src/app/models/contest';
import { PayingLinks } from 'src/app/models/paying-links';
import { TransmitToPost } from 'src/app/models/transmit-to-post.models';
import { Skill } from 'src/app/models/skill.models';
import { ListPostService } from 'src/app/services/list-post.service';
import { Post } from 'src/app/models/post.model';
import { MajorService } from 'src/app/services/major.service';
import { Major } from 'src/app/models/major';
import { FormGroup ,FormControl  } from '@angular/forms';
import { ConfigFunctionService } from 'src/app/services/config-function.service';
@Component({
  selector: 'app-recruitment',
  templateUrl: './recruitment.component.html',
  styleUrls: ['./recruitment.component.css']
})
export class RecruitmentComponent implements OnInit {
  companys: Array<Enterprise>;
  recruitments: Array<Recruitments>;
  recruitmentsHot: Array<Recruitments>;
  recruitmentLinks: Array<PayingLinks>;
  cinfigData: TransmitToPost;
  listPostResult : Array<Post>;
  majors: Array<Major>;

  // -------------
  statusCompany: boolean = false;
  statusRecruitments: boolean = false;
  statusRecruitmentsHot: boolean = false;

  constructor(public dialog: MatDialog,
    public companyService: CompanyService,
    public recruitmentService: RecruitmentsService,
    public listPostService : ListPostService,
    public majorService: MajorService,
    public configService: ConfigFunctionService) { }

    statusFilter : Array<any> = [
      {
        prams : 'normal',
        name: 'Mới nhất',
      },
      {
        prams : 'hot',
        name: 'Hot nhất',
      }
    ] 

    formFilter =  new FormGroup({
      filterName : new FormControl(''),
      filterSkill : new FormControl(''),
      filterMajor : new FormControl(''),
      filterStatus :  new FormControl(''),
    })

  ngOnInit(): void {
    this.getListRecruitment('hot');
    this.getListPost();
    this.getListMajor();
  }

  // Set filter value
  setValueFilterMajor(item: Major){
    this.formFilter.controls['filterMajor'].setValue(item.name);
  }

  // Set filter status
  setValueStatus(status:string){
    this.formFilter.controls['filterStatus'].setValue(status);
  }

  // Set keyword recruitments
  setValueKeyword(event : any){
    this.formFilter.controls['filterName'].setValue(event.target.value);
  }

  filterSelect(arr: Array<any> , value: string , input: string){    
    switch (input) {
      case 'major':
        if(!value){
          this.getListMajor();
        }else{
          this.majors = arr.filter(item =>  {return this.configService.changeString(item.name).includes(this.configService.changeString(value))}); 
        }
        break;
    
      default:
        break;
    }
  }


  // get list post
  getListPost() {
     this.listPostService.getPostWhereCate('post-recruitmentt').subscribe(res => {
      if(res.status){
        this.listPostResult = res.payload.data;
      }
    })
  }

  getListMajor(){
    this.majorService.getAll().subscribe(res => {
      if(res.status){
        this.majors = res.payload;
      }
    })
  }

  // Get listRecruitment
  getListRecruitment(url: string) {
    this.recruitments = [];
    this.recruitmentService.getAllRecruitment(url).subscribe(res => {
      if (res.status) {
        this.recruitments = res.payload.data;
        this.recruitmentLinks = res.payload.links;
        this.recruitments ? this.statusRecruitments = true : this.statusRecruitments;
      }
    })
  }

  // get skill limit
  getLimitSkill(arrSkill: Array<Skill>): Array<Skill> {
    let arrResult = arrSkill.filter((res, index) => {
      return index < 3;
    });
    return arrResult;
  }

  filterSkill(event: any){
     const skills = document.querySelectorAll('.filter-skill-item');
     for (let index = 0; index < skills.length; index++) {
      const element = skills[index];
      element.classList.remove('active');
     }
     event.currentTarget.classList.add('active');
  }

  // Filter recruitments
  filterRecruitments(){
    this.statusRecruitments = false;
    let keyword =this.formFilter.controls['filterName'].value;
    let major_id
    if(this.formFilter.controls['filterMajor'].value){
      major_id = this.majors.filter(item => item.name === this.formFilter.controls['filterMajor'].value)[0].id;
    }
    console.log(major_id);
    console.log(keyword);
    
    this.recruitmentService.filterRecruitment(keyword , 0 , major_id , 0).subscribe(res => {
      if(res.status){
        this.statusRecruitments = true;
        this.recruitments = res.payload.data;
        console.log(this.recruitments);
        
      }
    });
  }

}
