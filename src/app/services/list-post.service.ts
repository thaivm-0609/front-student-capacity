import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ResponsePayload } from "../models/response-payload";

@Injectable({
  providedIn: "root",
})
export class ListPostService {
  constructor(private http: HttpClient) { }

  // Get Post Where Category
  getPostWhereCate(cate: string): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}?post=${cate}`);
  }

  // Get all list post
  getAllListPost(): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}`);
  }
  // Get all list post

  getHotPost(): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}?postHot=hot`);
  }

  getPostByCategory(data: string): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}?post=${data}`);
  }

  // get posts by params
  getPostsByParam(args: {}): Observable<ResponsePayload> {
    const params = new HttpParams({
      fromObject: {
        ...args,
      },
    });

    return this.http.get<ResponsePayload>(`${environment.postListUrl}`, {
      params,
    });
  }

  // get detail post
  getPostBySlug(slug: any): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}/${slug}`);
  }

  // search
  searchPost(keyword: any): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}?keyword=${keyword}`);
  }

  uploadCV(data: any): Observable<ResponsePayload> {
    return this.http.post<ResponsePayload>(`${environment.candidateUrl}/add`, data);
  }

  filterPost(keyword: string, post: string | null = null, status: number | null | string = null): Observable<ResponsePayload> {
    let keywordQuery = keyword == null ? '' : keyword;
    let typePostChange = post == null ? '' : post;
    let statusPostChange = status == null ? '' : status;
    return this.http.get<ResponsePayload>(`${environment.postListUrl}?keyword=${keywordQuery}&post=${typePostChange}&postHot=${statusPostChange}`);
  } 
  searchPostRecruitment(keyword: string): Observable<ResponsePayload> {
    return this.http.get<ResponsePayload>(`${environment.postListUrl}?post=post-recruitment&keyword=${keyword}`);
  }
}
