import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, switchMap } from 'rxjs';
import { Contest } from 'src/app/models/contest';
import { ContestMember } from 'src/app/models/contest-member';
import { Round } from 'src/app/models/round.model';
import { Team } from 'src/app/models/team';
import { RoundService } from 'src/app/services/round.service';

@Component({
  selector: 'app-round-detail',
  templateUrl: './round-detail.component.html',
  styleUrls: ['./round-detail.component.css']
})
export class RoundDetailComponent implements OnInit {
  contestDetail: Array<Contest> = [];
  status: string = 'pending';
  roundDetail: Round;
  round_id: any;
  listMember: any;
  team: Team;

  constructor(private route: ActivatedRoute, private modalService: NgbModal, private roundService: RoundService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.round_id = params.get('id');
    });

    // Lấy ra vòng tiết
    this.roundService.getRoundWhereId(this.round_id).subscribe(res => {
      this.roundDetail = res.payload;
      if (this.roundDetail) {
        this.status = 'done';
      }
    });


  }

  // Đếm số thành viên
  getMembers(member: Array<ContestMember> = []): number {
    let totalMember = 0;
    member.forEach(t => {
      totalMember++;
    });
    return totalMember;
  }

  openVerticallyCentered(content: any, item: Team, listMember: any) {
    this.modalService.open(content, { centered: true });
    this.listMember = listMember;
    this.team = item;
  }
}