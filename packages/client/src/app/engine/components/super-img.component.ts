import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'super-img',
  styles: [
    `
      :host(super-img) {
        display: contents;
      }

      canvas {
        display: none;
      }

      img {
        max-width: unset !important;
      }

      div {
        background-color: var(--sonar-super-img-background);
      }
    `,
  ],
  template: `
    <div #test [style]="style">
      @if (showPlaceholder) {
        <img [src]="bluried" />
      }
      @if (loadImage) {
        <img
          [src]="imgSrc"
          crossorigin="anonymous"
          (load)="imgLoaded()"
          style="display: none"
          [attr.width]="width"
          [attr.height]="height"
          #imgRef
          [ngStyle]="{ display: showPlaceholder ? 'hidden' : 'unset' }"
        />
      }
      @if (showPlaceholder) {
        <canvas [attr.width]="32" [attr.height]="32"></canvas>
      }
    </div>
  `,
})
export class SuperImgComponent implements OnInit, OnDestroy, OnChanges {
  @Input() style: string;
  @Input() src: string;
  @Input() width: number;
  @Input() height: number;
  @ViewChild('test', { read: ElementRef, static: true }) test: ElementRef;
  @ViewChild('imgRef', { read: ElementRef, static: false })
  imgRef: ElementRef<HTMLImageElement>;
  imgSrc = '/assets/no-avatar.png';

  showPlaceholder = true;
  bluried = '/assets/no-avatar.png';
  loadImage = false;

  observer!: IntersectionObserver;

  constructor(
    private el: ElementRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.imgSrc = this.src;

    try {
      this.ngZone.runOutsideAngular(() => {
        this.observer = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting === true) {
              this.ngZone.run(() => {
                this.loadImage = true;
                this.observer?.disconnect();
              });
            }
          });
        });
        this.observer.observe(this.test.nativeElement);
      });
    } catch (err) {
      console.error(err);
      this.loadImage = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.src?.previousValue !== changes.src?.currentValue) {
      this.ngOnInit();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  imgLoaded() {
    console.log('loaded');
    this.showPlaceholder = false;
  }

  @HostListener('error')
  fixImageOnError() {
    console.log('eeorr');
    const fallback = '/assets/no-avatar.png';

    const element: HTMLImageElement = this.imgRef.nativeElement;
    if (element.crossOrigin === 'anonymous') {
      element.crossOrigin = null;
    }
    element.src = fallback;
  }
}
