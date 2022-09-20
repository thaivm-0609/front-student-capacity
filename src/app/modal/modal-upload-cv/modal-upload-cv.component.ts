import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { map, switchMap } from 'rxjs';
import { Post } from 'src/app/models/post.model';
import { ResponsePayload } from 'src/app/models/response-payload';
import { ListPostService } from 'src/app/services/list-post.service';

@Component({
  selector: 'app-modal-upload-cv',
  templateUrl: './modal-upload-cv.component.html',
  styleUrls: ['./modal-upload-cv.component.css']
})
export class ModalUploadCvComponent implements OnInit {
  postDetail: Post;
  validateForm!: FormGroup;
  statusRegister: boolean = true;
  fileUpload: any;

  // set up form control
  formUploadCv = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', Validators.required),
    file_link: new FormControl('')
  });

  constructor(
    public dialogRef: MatDialogRef<ModalUploadCvComponent>,
    private postService: ListPostService,
    private toast: NgToastService,
    @Inject(MAT_DIALOG_DATA)
    public dataPostDetail: { postDetail: Post }
  ) { }

  ngOnInit(): void {
  }
  closeDialog() {
    this.dialogRef.close('Pizza!');
  }

  // review file upload
  preview(files: any) {
    if (files.length === 0) return;
    var mimeType = files[0].type;
    // if (mimeType.match(/image\/*/) == null) {
    //   return;
    // }
    this.fileUpload = files[0];
  }

  //Send information Upload cv
  onSubmit() {
    this.statusRegister = false;
    let dataInput = { ...this.formUploadCv.value };
    var formDataInput = new FormData();
    
    formDataInput.append('name', dataInput.name);
    formDataInput.append('email', dataInput.email);
    formDataInput.append('phone', dataInput.phone);
    formDataInput.append('file_link', this.fileUpload);
    if (this.dataPostDetail.postDetail) formDataInput.append('post_id', this.dataPostDetail.postDetail.id)

    setTimeout(() => {
      this.postService.uploadCV(formDataInput).subscribe((res : ResponsePayload) => {
        if (res.status == false) {
          this.toast.warning({ summary: res.payload, duration: 2000 });
        } else {
          this.statusRegister = true;
          this.dialogRef.close();
        }
        return "Ok"
      });
    }, 1000);
  }
  confirmClose(){
    const confirm = window.confirm('Are you sure you want to close')
    if (confirm){
      this.dialogRef.close();
    }else{
    }
    
  }
}
