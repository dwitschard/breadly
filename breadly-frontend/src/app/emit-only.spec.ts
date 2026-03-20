import { TestBed } from '@angular/core/testing';
import { ProfileMenuComponent } from './shared/navbar/profile-menu.component';

describe('output emit only', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfileMenuComponent] }).compileComponents();
  });

  it('test 1: emits loginClick', () => {
    const fixture = TestBed.createComponent(ProfileMenuComponent);
    fixture.componentRef.setInput('profile', null);
    fixture.componentRef.setInput('isLoggedIn', false);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.loginClick.subscribe(() => emitted.push(1));
    fixture.componentInstance.loginClick.emit();
    console.log('test1 emitted:', emitted.length);
    expect(emitted.length).toBe(1);
  });

  it('test 2: emits loginClick (second test, same beforeEach)', () => {
    const fixture = TestBed.createComponent(ProfileMenuComponent);
    fixture.componentRef.setInput('profile', null);
    fixture.componentRef.setInput('isLoggedIn', false);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.loginClick.subscribe(() => emitted.push(1));
    fixture.componentInstance.loginClick.emit();
    console.log('test2 emitted:', emitted.length);
    expect(emitted.length).toBe(1);
  });
});
