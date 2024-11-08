import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-credentials-tab',
  templateUrl: './credentials-tab.component.html',
  styleUrls: ['./credentials-tab.component.scss'],
  standalone: true,
  imports:[RouterOutlet]
})
export class CredentialsTabComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
