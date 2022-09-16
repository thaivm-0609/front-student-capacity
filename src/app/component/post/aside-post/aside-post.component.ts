import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from 'src/app/models/post.model';
import { ListPostService } from 'src/app/services/list-post.service';

@Component({
  selector: 'app-aside-post',
  templateUrl: './aside-post.component.html',
  styleUrls: ['./aside-post.component.css']
})
export class AsidePostComponent implements OnInit {
  validateForm!: FormGroup; 
  inputKeyword: string;
  paramsObject: any

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute
    ) { }

  ngOnInit(): void {
    

    this.validateForm = this.fb.group({
      keyword: [null, [Validators.required]],
    });
  }

  // tìm kiếm
  searchPost() {  
    if (this.validateForm.valid) {
      this.router.navigateByUrl(`/tim-kiem/bai-viet?keyword=${this.inputKeyword}`);
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }    
  }
  
}
