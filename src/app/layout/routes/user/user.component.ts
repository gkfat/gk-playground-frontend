import { delay, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Params } from '@angular/router';
import { UsersService } from 'src/app/api/users.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseComponent } from 'src/app/components/base.component';
import { Users } from 'src/app/core/models';
import { of, tap, catchError, map, takeUntil, BehaviorSubject, Observable } from 'rxjs';
import { AuthState, selectState } from 'src/app/store/auth';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent extends BaseComponent implements OnInit {
  private auth$ = this.authStore.select(selectState);
  public queryUserId: number | null = null;
  public queryUser: Users.User | null = null;
  public isUserSelf: boolean = false;
  public user: Users.User | null = null;
  
  constructor(
    private usersServ: UsersService,
    private authStore: Store<AuthState>,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ) { super(); }

  ngOnInit() {
    this.authListener();
  }

  // 監聽登入
  private authListener() {
    this.auth$.pipe(
      takeUntil(this.unsubscribe$),
      tap(state => {
        if ( state.user ) {
          this.user = state.user;
          this.routeParamListener();
        }
      })
    ).subscribe();
  }

  public routeParamListener() {
    this.activatedRoute.queryParams.pipe(
      takeUntil(this.unsubscribe$),
      switchMap((params: Params) => {
        // Clear
        this.isUserSelf = false;
        this.queryUser = null;
        this.cd.markForCheck();
        const queryUserId = parseInt(params['id']);
        this.isUserSelf = this.user!.id === queryUserId;
        if ( !this.isUserSelf && queryUserId && typeof queryUserId === 'number' && !isNaN(queryUserId) ) {
          this.queryUserId = queryUserId;
          const payload = new Users.FetchUsers();
          payload.ids.push(queryUserId);
          return this.usersServ.FetchUsers(payload).pipe(
            map(res => res.data.data[0])
          );
        } else {
          this.queryUserId = this.user!.id;
          return of(this.user);
        }
      }),
      delay(100),
      tap(user => {
        this.queryUser = user;
        this.cd.markForCheck();
      })
    ).subscribe();
  }

}
