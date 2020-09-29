import { Component, OnInit } from '@angular/core';
import { StudentRecordItem } from '../types/student-record-item';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { RecordsService } from '../records.service';
import { Grade } from '../types/grade';
import { Time } from '../types/time';
import { FormControl, FormGroup } from '@angular/forms';
import { ConventionsService } from '../conventions.service';

@Component({
  selector: 'app-student-record',
  templateUrl: './student-record.page.html',
  styleUrls: ['./student-record.page.scss'],
})
export class StudentRecordPage implements OnInit { //, OnChanges

  private tid: string; //Time ID
  private sid: string; //Student ID
  _time: Subject<Time> = new Subject();
  _record: Observable<StudentRecordItem>;
  nextStudent: string;

  grades: Grade[];

  gradeForm = new FormGroup({
    present: new FormControl(true),
    excuse: new FormControl(false),
    grade: new FormControl()
  });

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private service: RecordsService, private conventionsService: ConventionsService) {
    this.grades = this.conventionsService.grades();
  }

  ngOnInit() {
    this.tid = this.activatedRoute.snapshot.paramMap.get('time');
    this.sid = this.activatedRoute.snapshot.paramMap.get('student');
    this._record = this.service.timeRecords(this.tid)
      .pipe(
        tap(t => this._time.next(t)),
        map(t => {
          let i = t.records.findIndex(r => r.student === this.sid)
          let ret = t.records[i];
          if (i + 1 < t.records.length) this.nextStudent = t.records[i + 1].student;
          return ret;
        }),
        tap(i => { if (i) this.gradeForm.patchValue(i) }),
        shareReplay()
      );
  }

  onSubmitGrade() {
    //this is called once with null value when the component is initialized
    let val = this.gradeForm.value as { grade: string; present: boolean; excuse: boolean; };
    let g: string = StudentRecordItem.evaluate(val);
    if (g) this.service.setStudentGrade(this.tid, this.sid, g)
      .catch(e => console.log(e));
  }

  addNote() {
    //this.record.notes.push(r);
  }

  next() {
    if (this.nextStudent) {
      this.router.navigate(['/tabs/times/' + this.tid + '/' + this.nextStudent]);
    } else {
      this.router.navigate(['/tabs/times/' + this.tid]);
    }
  }

  times() {
    this.router.navigate(['/tabs/times']);
  }
}
