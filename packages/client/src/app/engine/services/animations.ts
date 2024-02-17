import { createAnimation, Animation } from '@ionic/angular/standalone';

export const EnterSideAnimation =
  (side: 'left' | 'right') =>
  (baseEl: HTMLElement, _presentingEl?: HTMLElement): Animation => {
    if (!baseEl.classList.contains(`side-modal-${side}`)) {
      baseEl.classList.add(`side-modal-${side}`);
    }
    const modal = baseEl.shadowRoot;
    const backdropAnimation = createAnimation()
      .addElement(modal.querySelector('ion-backdrop'))
      .fromTo('opacity', 0.01, 0.2);

    const wrapperAnimation = createAnimation()
      .addElement(modal.querySelectorAll('.modal-wrapper, .modal-shadow'))
      .fromTo(
        'transform',
        `translateX(${side === 'left' ? '-100vw' : '100vw'})`,
        `translateX(${side === 'left' ? '0vw' : '0vw'})`,
      );

    const baseAnimation = createAnimation().addElement(baseEl).duration(300);

    baseAnimation.addAnimation([backdropAnimation, wrapperAnimation]);

    return baseAnimation;
  };

export const LeaveSideAnimation =
  (side: 'left' | 'right') =>
  (baseEl: HTMLElement, _presentingEl?: HTMLElement): Animation => {
    const modal = baseEl.shadowRoot;
    const backdropAnimation = createAnimation()
      .addElement(modal.querySelector('ion-backdrop'))
      .fromTo('opacity', 0.2, 0.01);

    const wrapperAnimation = createAnimation()
      .addElement(modal.querySelectorAll('.modal-wrapper, .modal-shadow'))
      .fromTo(
        'transform',
        `translateX(${side === 'left' ? '-0vw' : '0vw'})`,
        `translateX(${side === 'left' ? '-100vw' : '100vw'})`,
      );

    const baseAnimation = createAnimation().addElement(baseEl).duration(300);

    baseAnimation.addAnimation([backdropAnimation, wrapperAnimation]);

    return baseAnimation;
  };

export const notAnimation = (
  _baseEl: HTMLElement,
  _presentingEl?: HTMLElement,
): Animation => createAnimation();
