import { Component, OnInit, ViewChild } from '@angular/core';
import { UiModalComponent } from 'src/app/theme/shared/components/modal/ui-modal/ui-modal.component';
import { FormControl, Validators, FormArray } from '@angular/forms';
import { WalletNamePasswordModalComponent } from '../wallet-name-password-modal/wallet-name-password-modal.component';

@Component({
  selector: 'app-create-wallet-modal',
  templateUrl: './create-wallet-modal.component.html',
  styleUrls: ['./create-wallet-modal.component.scss']
})
export class CreateWalletModalComponent implements OnInit {
  
  @ViewChild('createWalletModal1', { static: true }) createWalletModal1: WalletNamePasswordModalComponent;
  @ViewChild('createWalletModal2', { static: true }) createWalletModal2: UiModalComponent;
  @ViewChild('createWalletModal3', { static: true }) createWalletModal3: UiModalComponent;
  @ViewChild('createWalletModal4', { static: true }) createWalletModal4: UiModalComponent;

  constructor() { }
  
  ngOnInit() {
  }
  
  public show() {
    this.createWalletModal1.show();
  }
  
  onSubmitNameAndPasswordModal(NameAndPasswordValues) {
    console.log(NameAndPasswordValues); // This is where the action should take place
    this.createWalletModal2.show();
  }
  
  /* Mnemonic seed */
  /* Used to display a "Copied!" badge to copy to clipboard button */
  exampleSeed: string[] = ["cover", "palace", "renew", "address", "orchard", "derive", "promote", "similar", "artist", "cage", "dial", "forget", "print", "extend", "scissors", "festival", "donor", "peasant", "spawn", "donate", "fever", "olive", "section", "device"];

  seedCopiedToClipboard: boolean = false;
  
  copySeedToClipboard() {
    this.seedCopiedToClipboard = true
    setTimeout(() => {
      this.seedCopiedToClipboard = false;
    }, 3000);
  }
  
  /* Mnemonic seed confirmation */
  seedWordsConfirmationForm: FormArray;
  wordsToConfirm: boolean[];
  readonly NUMBER_SEED_WORDS_TO_CONFIRM: number = 12;
  
  seedConfirmationPreparation() {
    this.wordsToConfirm = this.chooseRandomWordsToConfirm(this.exampleSeed, this.NUMBER_SEED_WORDS_TO_CONFIRM);
    this.seedWordsConfirmationForm = this.createSeedForm(this.exampleSeed, this.wordsToConfirm);
  }
  
  onSubmitMnemonicSeedConfirmationForm() {
    if (this.seedWordsConfirmationForm.valid) {
      this.createWalletModal3.hide();
      console.log(this.seedWordsConfirmationForm); // The action should take place here
      this.createWalletModal4.show();
    } else {
      for (let i = 0; i < this.seedWordsConfirmationForm.length; i++) {
        this.seedWordsConfirmationForm.controls[i].markAsTouched();
      }
    }
  }
  
  private createSeedForm(seed: string[], wordsToConfirm: boolean[]) {
    const seedConfirmationForm = new FormArray([]);
    for (let i = 0; i < seed.length; i++) {
      if (wordsToConfirm[i]) {
        seedConfirmationForm.push(new FormControl('', [Validators.required, Validators.pattern(seed[i])]));
      } else {
        seedConfirmationForm.push(new FormControl(seed[i], [Validators.required]));
      }
    }
    return seedConfirmationForm;
  }
  
  private chooseRandomWordsToConfirm(seed: string[], amountToConfirm: number): boolean[] {
    const numbersToConfirm: number[] = [];
    for(let i = 0; i < amountToConfirm; i++) {
      let randomPick: number = this.getRandomInt(0, seed.length);
      while (numbersToConfirm.includes(randomPick)) {
        randomPick = this.getRandomInt(0, seed.length);
      }
      numbersToConfirm.push(this.getRandomInt(0, seed.length));
    }
    const wordsToConfirm: boolean[] = [];
    for(let i = 0; i < seed.length; i++) {
      if (numbersToConfirm.includes(i)) {
        wordsToConfirm[i] = true;
      } else {
        wordsToConfirm[i] = false;
      }
    }
    return wordsToConfirm;
  }

  private getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /* Wallet creation recap */
  walletCreationConfirmationLoading: boolean = false;
  
  simulateLoadingThenHide(modalElement: UiModalComponent, loadingTime: number, hidingBooleanName: string) {
    // I'm sure there's a way to avoid this
    this[hidingBooleanName] = true;
    setTimeout(() => {
      modalElement.hide();
      setTimeout(() => {
        this[hidingBooleanName] = false;
      }, 300); // The time of the modal hiding animation
    }, loadingTime);
  }
  
}
