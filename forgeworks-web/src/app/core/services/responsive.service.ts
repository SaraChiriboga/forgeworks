import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})

export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  // puntos de quiebre sincronizados con el sass (640px y 1024px)
  private readonly small = '(max-width: 640px)';
  private readonly medium = '(min-width: 641px) and (max-width: 1024px)';
  private readonly large = '(min-width: 1025px)';

  private screenWidth = toSignal(
    this.breakpointObserver.observe([this.small, this.medium, this.large])
  );

  // señales booleanas
  isSmall = computed(() => !!this.screenWidth()?.breakpoints[this.small]);
  isMedium = computed(() => !!this.screenWidth()?.breakpoints[this.medium]);
  isLarge = computed(() => !!this.screenWidth()?.breakpoints[this.large]);

  // alias descriptivos
  isMobile = this.isSmall;
  isTablet = this.isMedium;
  isDesktop = this.isLarge;

  smallWidth = this.isSmall;
  mediumWidth = this.isMedium;
  largeWidth = this.isLarge;
}